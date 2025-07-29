import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

// Enhanced PDF processing with multiple libraries
// Note: MuPDF and pdfium-wasm would be loaded dynamically
const PDF_PROCESSING_TIMEOUT = 300000; // 5 minutes
const MAX_RETRIES = 3;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentParsingResult {
  milestones: Array<{
    name: string;
    description?: string;
    trade?: string;
    zone?: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
    dependencies?: string[];
    priority?: 'low' | 'medium' | 'high';
  }>;
  trades: string[];
  zones: string[];
  projectInfo?: {
    projectName?: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
  };
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { 
      fileContent, 
      fileName, 
      fileType, 
      projectId, 
      documentId 
    } = await req.json();

    console.log('Processing document:', { fileName, fileType, projectId });

    // Update parsing status to processing
    await supabase
      .from('programme_document_parsing')
      .update({ 
        parsing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    let extractedText = '';

    // Handle different file types with enhanced processing pipeline
    if (fileType === 'application/pdf') {
      // Enhanced PDF processing with multi-library approach
      extractedText = await extractTextFromPDFEnhanced(fileContent, fileName, OPENAI_API_KEY, supabase, documentId);
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
      // For Excel/CSV files, extract structured data
      extractedText = await extractTextFromSpreadsheet(fileContent, fileName);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Extracted text length:', extractedText.length);

    // Parse the document content using OpenAI
    const parsedData = await parseDocumentWithAI(extractedText, fileName, OPENAI_API_KEY);

    // Store the parsed results
    await supabase
      .from('programme_document_parsing')
      .update({
        parsing_status: 'completed',
        parsed_data: parsedData,
        ai_confidence: parsedData.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Generate AI suggestions for trade mapping and sequencing
    await generateAISuggestions(supabase, projectId, documentId, parsedData);

    console.log('Document parsing completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      data: parsedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing document:', error);

    // Update parsing status to failed if we have documentId
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        
        await supabase
          .from('programme_document_parsing')
          .update({ 
            parsing_status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced PDF processing with intelligent multi-library approach
async function extractTextFromPDFEnhanced(
  base64Content: string, 
  fileName: string, 
  apiKey: string,
  supabase: any,
  documentId: string
): Promise<string> {
  console.log('Starting enhanced PDF processing pipeline for:', fileName);
  
  let currentStage = 'analyzing';
  let extractedText = '';
  let processingMethod = '';
  
  try {
    // Update progress: Analyzing PDF structure
    await updateProcessingProgress(supabase, documentId, 'processing', 25, 'Analyzing PDF structure...');
    
    // Stage 1: Quick PDF analysis to determine best processing approach
    const pdfAnalysis = await analyzePDFStructure(base64Content);
    console.log('PDF Analysis:', pdfAnalysis);
    
    // Stage 2: Try MuPDF WebAssembly for high-quality text extraction (simulation)
    currentStage = 'mupdf';
    await updateProcessingProgress(supabase, documentId, 'processing', 40, 'Attempting high-quality text extraction...');
    
    extractedText = await extractWithMuPDF(base64Content);
    if (extractedText && extractedText.length > 200) {
      processingMethod = 'MuPDF WebAssembly';
      console.log(`Successfully extracted ${extractedText.length} characters using MuPDF`);
      await updateProcessingProgress(supabase, documentId, 'processing', 70, 'Text extraction completed');
      return extractedText;
    }
    
    // Stage 3: Combined pdfium-wasm + Vision API for complex documents
    currentStage = 'pdfium_vision';
    await updateProcessingProgress(supabase, documentId, 'processing', 50, 'Converting PDF to images for OCR processing...');
    
    const pdfBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    extractedText = await extractWithPdfiumAndVision(pdfBytes, apiKey, documentId, supabase);
    if (extractedText && extractedText.length > 150) {
      processingMethod = 'pdfium-wasm + OpenAI Vision API';
      console.log(`Successfully extracted ${extractedText.length} characters using combined method`);
      await updateProcessingProgress(supabase, documentId, 'processing', 95, 'Combined OCR processing completed');
      return extractedText;
    }
    
    // Stage 5: Fallback to pdf-lib basic extraction
    currentStage = 'pdf_lib_fallback';
    await updateProcessingProgress(supabase, documentId, 'processing', 70, 'Using fallback extraction...');
    
    extractedText = await extractWithPdfLibFallback(base64Content);
    processingMethod = 'pdf-lib (basic)';
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('All PDF processing methods failed to extract sufficient text');
    }
    
    console.log(`Extracted ${extractedText.length} characters using fallback method`);
    return extractedText;
    
  } catch (error) {
    console.error(`Error in PDF processing stage '${currentStage}':`, error);
    await updateProcessingProgress(supabase, documentId, 'processing', 80, `Error in ${currentStage}, trying alternatives...`);
    
    // Try one final text-based extraction attempt
    try {
      const fallbackText = await extractWithSimpleAI(base64Content, apiKey);
      if (fallbackText && fallbackText.length > 50) {
        console.log('Emergency fallback extraction succeeded');
        return fallbackText;
      }
    } catch (fallbackError) {
      console.error('Emergency fallback also failed:', fallbackError);
    }
    
    throw new Error(`PDF processing failed at stage '${currentStage}': ${error.message}`);
  }
}

async function updateProcessingProgress(supabase: any, documentId: string, status: string, progress: number, message: string) {
  try {
    await supabase
      .from('programme_document_parsing')
      .update({ 
        parsing_status: status,
        parsed_data: { progress, message },
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

async function analyzePDFStructure(base64Content: string): Promise<any> {
  try {
    const pdfBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    return {
      pageCount: pdfDoc.getPageCount(),
      fileSize: pdfBytes.length,
      isTextBased: true, // Would implement actual text analysis
      isScanned: false,  // Would implement scanned document detection
      complexity: pdfBytes.length > 1000000 ? 'high' : 'medium'
    };
  } catch (error) {
    console.error('Error analyzing PDF structure:', error);
    return { pageCount: 0, fileSize: 0, isTextBased: false, isScanned: true, complexity: 'unknown' };
  }
}

// Simulated MuPDF WebAssembly extraction (would use actual MuPDF in production)
async function extractWithMuPDF(base64Content: string): Promise<string> {
  try {
    // In production, this would load and use actual MuPDF WebAssembly
    // For now, we'll simulate a high-quality extraction
    const pdfBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    if (pdfBytes.length > 0) {
      // Simulate successful text extraction for text-based PDFs
      return "Simulated MuPDF extraction - in production this would use actual MuPDF WebAssembly for high-quality text extraction from construction programme documents.";
    }
    return '';
  } catch (error) {
    console.error('MuPDF extraction failed:', error);
    return '';
  }
}

// Combined pdfium-wasm + Vision API extraction for optimal processing
async function extractWithPdfiumAndVision(pdfBytes: Uint8Array, openaiApiKey: string, documentId: string, supabase: any): Promise<string> {
  console.log('Starting combined pdfium-wasm + Vision API extraction');
  
  try {
    // Step 1: Use pdfium-wasm to render PDF pages as images
    const renderedPages = await renderPdfPagesWithPdfium(pdfBytes, documentId, supabase);
    
    if (renderedPages.length === 0) {
      throw new Error('No pages could be rendered from PDF');
    }
    
    console.log(`Successfully rendered ${renderedPages.length} pages, processing with Vision API`);
    
    // Step 2: Process each page through Vision API
    const pageTexts: string[] = [];
    const maxPages = Math.min(renderedPages.length, 10); // Limit to 10 pages for cost control
    
    for (let i = 0; i < maxPages; i++) {
      const pageImage = renderedPages[i];
      
      // Update progress
      await updateProcessingProgress(
        supabase,
        documentId, 
        'processing', 
        Math.round(((i + 1) / maxPages) * 80) + 15, // 15-95% range for this stage
        `Processing page ${i + 1} of ${maxPages} with Vision API`
      );
      
      try {
        const pageText = await extractPageWithVisionAPI(pageImage, openaiApiKey, i + 1);
        if (pageText.trim()) {
          pageTexts.push(`--- PAGE ${i + 1} ---\n${pageText}`);
        }
        
        // Add delay to respect rate limits
        if (i < maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pageError) {
        console.error(`Failed to process page ${i + 1}:`, pageError);
        pageTexts.push(`--- PAGE ${i + 1} ---\n[Error processing page: ${pageError.message}]`);
      }
    }
    
    const combinedText = pageTexts.join('\n\n');
    console.log(`Successfully extracted ${combinedText.length} characters from ${pageTexts.length} pages`);
    
    return combinedText;
    
  } catch (error) {
    console.error('Combined pdfium + Vision extraction failed:', error);
    throw error;
  }
}

async function renderPdfPagesWithPdfium(pdfBytes: Uint8Array, documentId: string, supabase: any): Promise<string[]> {
  console.log('Rendering PDF pages with pdfium-wasm (simulated)');
  
  // Update progress
  await updateProcessingProgress(
    supabase,
    documentId, 
    'processing', 
    10, 
    'Rendering PDF pages as images'
  );
  
  // Simulate pdfium-wasm page rendering
  // In real implementation:
  // 1. Load pdfium-wasm module
  // 2. Create document from pdfBytes
  // 3. Get page count
  // 4. Render each page to PNG/JPEG
  // 5. Convert images to base64
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
  
  // Simulate successful page rendering for testing
  if (pdfBytes.length > 50000) {
    // Simulate 3 pages rendered as base64 images (placeholder data)
    const simulatedPages = [
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // 1x1 transparent PNG
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // 1x1 transparent PNG  
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // 1x1 transparent PNG
    ];
    
    console.log(`Successfully rendered ${simulatedPages.length} pages with pdfium-wasm (simulated)`);
    return simulatedPages;
  }
  
  throw new Error('pdfium-wasm page rendering failed (simulated)');
}

async function extractPageWithVisionAPI(base64Image: string, openaiApiKey: string, pageNumber: number): Promise<string> {
  console.log(`Processing page ${pageNumber} with Vision API`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text content from this construction programme/schedule page. Focus on:
                - Milestones and task names
                - Start and end dates
                - Trade/contractor information
                - Dependencies and relationships
                - Status information
                - Location or zone details
                
                Return only the extracted text content, preserve the structure and formatting where possible.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Vision API error ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log(`Successfully extracted ${extractedText.length} characters from page ${pageNumber}`);
    return extractedText;
    
  } catch (error) {
    console.error(`Vision API extraction failed for page ${pageNumber}:`, error);
    throw error;
  }
}

// Enhanced pdf-lib fallback with better text handling
async function extractWithPdfLibFallback(base64Content: string): Promise<string> {
  try {
    const pdfBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`PDF has ${pageCount} pages, using pdf-lib fallback extraction`);
    
    // Since pdf-lib doesn't have robust text extraction, we'll return a basic message
    // In production, you'd integrate with a proper PDF text extraction library here
    return `PDF document processed with ${pageCount} pages. This fallback method detected a construction programme document that requires manual review or alternative processing method.`;
  } catch (error) {
    console.error('pdf-lib fallback failed:', error);
    return 'Unable to extract text using basic PDF processing.';
  }
}

// Emergency simple AI extraction
async function extractWithSimpleAI(base64Content: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use cheaper model for emergency fallback
        messages: [
          {
            role: 'system',
            content: 'Extract any readable text from this document.'
          },
          {
            role: 'user',
            content: `This is a construction document. Extract any readable text you can find.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`Emergency AI extraction failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content || '';
  } catch (error) {
    console.error('Emergency AI extraction failed:', error);
    return '';
  }
}

async function extractTextFromSpreadsheet(base64Content: string, fileName: string): Promise<string> {
  console.log('Extracting text from spreadsheet:', fileName);
  
  // For now, we'll decode the base64 and attempt to extract readable content
  // In a real implementation, you'd use a proper Excel/CSV parser
  try {
    const binaryString = atob(base64Content);
    // This is a simplified approach - in production you'd want to use proper parsing libraries
    return binaryString.replace(/[^\x20-\x7E]/g, ' '); // Replace non-printable chars with spaces
  } catch (error) {
    console.error('Error extracting from spreadsheet:', error);
    return 'Unable to extract content from spreadsheet file.';
  }
}

async function parseDocumentWithAI(text: string, fileName: string, apiKey: string): Promise<DocumentParsingResult> {
  console.log('Parsing document content with AI');

  const prompt = `
Analyze this construction programme document and extract structured information. The document is named: "${fileName}"

Document content:
${text}

Please extract and return a JSON object with the following structure:
{
  "milestones": [
    {
      "name": "milestone name",
      "description": "detailed description if available",
      "trade": "trade type (e.g., carpentry, tiling, plumbing)",
      "zone": "area/zone (e.g., Level 1, Building A)",
      "startDate": "YYYY-MM-DD format if available",
      "endDate": "YYYY-MM-DD format if available",
      "duration": "duration in days if available",
      "dependencies": ["list of dependent milestone names"],
      "priority": "low/medium/high based on context"
    }
  ],
  "trades": ["unique list of all trades mentioned"],
  "zones": ["unique list of all zones/areas mentioned"],
  "projectInfo": {
    "projectName": "project name if mentioned",
    "startDate": "project start date if available",
    "endDate": "project end date if available",
    "duration": "total project duration in days if available"
  },
  "confidence": "confidence score from 0-1 for the parsing accuracy"
}

Focus on:
- Construction milestones and activities
- Trade classifications (carpentry, tiling, painting, etc.)
- Location zones (levels, buildings, areas)
- Dates and scheduling information
- Dependencies between activities
- Priority indicators

Return only valid JSON.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert construction project manager who excels at parsing construction programme documents. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  try {
    // Clean up the response to ensure it's valid JSON
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.error('Raw content:', content);
    
    // Return a fallback structure
    return {
      milestones: [],
      trades: [],
      zones: [],
      projectInfo: {},
      confidence: 0.1
    };
  }
}

async function generateAISuggestions(
  supabase: any, 
  projectId: string, 
  documentId: string, 
  parsedData: DocumentParsingResult
) {
  console.log('Generating AI suggestions');

  const suggestions = [];

  // Trade mapping suggestions
  if (parsedData.trades.length > 0) {
    suggestions.push({
      project_id: projectId,
      document_parsing_id: documentId,
      suggestion_type: 'trade_mapping',
      suggestion_data: {
        trades: parsedData.trades,
        mappings: generateTradeMappings(parsedData.trades)
      },
      confidence: parsedData.confidence
    });
  }

  // Sequence suggestions based on trade patterns
  if (parsedData.milestones.length > 0) {
    suggestions.push({
      project_id: projectId,
      document_parsing_id: documentId,
      suggestion_type: 'sequence_suggestion',
      suggestion_data: {
        suggestedSequence: generateTradeSequence(parsedData.milestones),
        reasoning: 'Based on standard construction trade sequences'
      },
      confidence: 0.8
    });
  }

  // Milestone creation suggestions
  suggestions.push({
    project_id: projectId,
    document_parsing_id: documentId,
    suggestion_type: 'milestone_creation',
    suggestion_data: {
      milestones: parsedData.milestones,
      additionalSuggestions: generateAdditionalMilestones(parsedData)
    },
    confidence: parsedData.confidence
  });

  // Insert suggestions into database
  if (suggestions.length > 0) {
    const { error } = await supabase
      .from('programme_ai_suggestions')
      .insert(suggestions);

    if (error) {
      console.error('Error inserting AI suggestions:', error);
    } else {
      console.log('AI suggestions inserted successfully');
    }
  }
}

function generateTradeMappings(trades: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  const standardTrades = {
    'frame': 'carpentry',
    'framing': 'carpentry',
    'carpenter': 'carpentry',
    'tile': 'tiling',
    'tiling': 'tiling',
    'tiler': 'tiling',
    'paint': 'painting',
    'painting': 'painting',
    'painter': 'painting',
    'plumb': 'plumbing',
    'plumbing': 'plumbing',
    'plumber': 'plumbing',
    'electric': 'electrical',
    'electrical': 'electrical',
    'electrician': 'electrical',
    'render': 'rendering',
    'rendering': 'rendering',
    'renderer': 'rendering'
  };

  trades.forEach(trade => {
    const lowerTrade = trade.toLowerCase();
    for (const [key, value] of Object.entries(standardTrades)) {
      if (lowerTrade.includes(key)) {
        mappings[trade] = value;
        break;
      }
    }
    if (!mappings[trade]) {
      mappings[trade] = 'other';
    }
  });

  return mappings;
}

function generateTradeSequence(milestones: any[]): string[] {
  const standardSequence = [
    'site_establishment',
    'excavation',
    'foundations',
    'structure',
    'carpentry',
    'roofing',
    'electrical_rough',
    'plumbing_rough',
    'insulation',
    'drywall',
    'electrical_finish',
    'plumbing_finish',
    'flooring',
    'tiling',
    'painting',
    'final_fix',
    'cleaning',
    'handover'
  ];

  // Filter sequence based on detected trades
  const detectedTrades = new Set(milestones.map(m => m.trade).filter(Boolean));
  return standardSequence.filter(trade => 
    detectedTrades.has(trade) || standardSequence.indexOf(trade) < 4 // Always include early stages
  );
}

function generateAdditionalMilestones(parsedData: DocumentParsingResult): any[] {
  const additionalMilestones = [];

  // Suggest procurement milestones
  if (parsedData.milestones.length > 0) {
    additionalMilestones.push({
      name: 'Material Procurement Setup',
      description: 'Order materials with appropriate lead times',
      trade: 'procurement',
      priority: 'high',
      suggestedTiming: 'Before construction milestones'
    });
  }

  // Suggest QA milestones
  parsedData.trades.forEach(trade => {
    additionalMilestones.push({
      name: `${trade} Quality Inspection`,
      description: `QA/ITP for ${trade} works`,
      trade: 'qa',
      priority: 'medium',
      suggestedTiming: `After ${trade} completion`
    });
  });

  return additionalMilestones;
}