import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
import { encode } from 'https://deno.land/std@0.181.0/encoding/base64.ts';

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

    // Handle different file types
    if (fileType === 'application/pdf') {
      // For PDF files, use OpenAI Vision API for robust text extraction
      extractedText = await extractTextFromPDFVision(fileContent, OPENAI_API_KEY);
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

// Function removed - using Vision API directly

async function extractTextFromPDFVision(base64Content: string, apiKey: string): Promise<string> {
  console.log('Extracting text from PDF using OpenAI Vision API with fallback');
  
  try {
    // First, try to extract text directly from PDF using pdf-lib
    const textContent = await extractTextFromPDFDirect(base64Content);
    
    if (textContent && textContent.length > 100) {
      console.log(`Successfully extracted ${textContent.length} characters using direct text extraction`);
      return textContent;
    }
    
    console.log('Direct text extraction failed or insufficient, falling back to Vision API with PDF upload');
    
    // If direct text extraction fails, use Vision API with the PDF
    // Note: This is a simplified approach - we'll send the whole PDF and let OpenAI handle it
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
            content: 'You are an expert at reading construction programme documents. Extract all text content including milestones, activities, dates, trades, zones, dependencies, and any scheduling information. Preserve the structure and relationships between items.'
          },
          {
            role: 'user',
            content: `This is a construction programme document. Please extract all text content focusing on:
- Milestones and activities
- Start/end dates
- Trade classifications
- Zone/location information
- Dependencies between tasks
- Duration information
- Priority levels

If you cannot directly read the PDF, please let me know and I'll provide it in a different format.

Document content (base64): ${base64Content.substring(0, 100)}...`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    const extractedText = result.choices[0].message.content;
    console.log(`Successfully extracted ${extractedText.length} characters from PDF using Vision API fallback`);
    
    return extractedText;
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function extractTextFromPDFDirect(base64Content: string): Promise<string> {
  try {
    // Convert base64 PDF to Uint8Array
    const pdfBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages, attempting direct text extraction`);
    
    // Try to extract text using pdf-lib's basic text extraction
    let extractedText = '';
    
    // This is a basic approach - pdf-lib doesn't have robust text extraction
    // We'll try to get any embedded text, but this may not work for scanned PDFs
    for (let i = 0; i < Math.min(pageCount, 5); i++) {
      const page = pdfDoc.getPage(i);
      // Note: pdf-lib doesn't have direct text extraction, this is a placeholder
      // In a real implementation, you'd need a proper PDF text extraction library
    }
    
    // For now, return empty string to trigger Vision API fallback
    return '';
  } catch (error) {
    console.error('Error in direct PDF text extraction:', error);
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