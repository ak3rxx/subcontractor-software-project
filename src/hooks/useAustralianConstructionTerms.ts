import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConstructionTerm {
  id: string;
  term: string;
  category: string;
  trade?: string;
  confidence: number;
  context?: string;
  aliases?: string[];
}

export interface TerminologyPattern {
  pattern: RegExp;
  category: string;
  trade?: string;
  extractionHint: string;
}

// Enhanced Australian Construction Terminology Database
const AUSTRALIAN_CONSTRUCTION_TERMS = {
  // Carpentry terminology - the most critical for this implementation
  carpentry: {
    primary: [
      { term: 'fit off', category: 'carpentry_activity', aliases: ['fitoff', 'fit-off'] },
      { term: 'fix out', category: 'carpentry_activity', aliases: ['fixout', 'fix-out'] },
      { term: 'door install', category: 'carpentry_installation', aliases: ['door installation', 'door fitting'] },
      { term: 'delivery of door jambs', category: 'carpentry_delivery', aliases: ['door jamb delivery', 'jambs delivery'] },
      { term: 'delivery of skirting', category: 'carpentry_delivery', aliases: ['skirting delivery', 'skirtings delivery'] },
      { term: 'architraves', category: 'carpentry_component', aliases: ['architrave', 'door frames'] },
      { term: 'cornices', category: 'carpentry_component', aliases: ['cornice', 'ceiling trim'] },
      { term: 'window frames', category: 'carpentry_component', aliases: ['window frame', 'frames'] },
      { term: 'cabinetry', category: 'carpentry_specialist', aliases: ['cabinets', 'kitchen install'] },
      { term: 'joinery', category: 'carpentry_specialist', aliases: ['custom joinery', 'built-in'] }
    ],
    phases: [
      { term: 'first fix', category: 'carpentry_phase', aliases: ['1st fix', 'rough carpentry'] },
      { term: 'second fix', category: 'carpentry_phase', aliases: ['2nd fix', 'finish carpentry'] },
      { term: 'finish carpentry', category: 'carpentry_phase', aliases: ['final carpentry', 'finishing'] }
    ],
    structural: [
      { term: 'timber frame', category: 'carpentry_structural', aliases: ['timber framing', 'wood frame'] },
      { term: 'steel frame', category: 'carpentry_structural', aliases: ['steel framing', 'metal frame'] },
      { term: 'floor systems', category: 'carpentry_structural', aliases: ['flooring system', 'floor structure'] },
      { term: 'roof trusses', category: 'carpentry_structural', aliases: ['trusses', 'roof structure'] },
      { term: 'wall frames', category: 'carpentry_structural', aliases: ['wall framing', 'stud walls'] },
      { term: 'internal linings', category: 'carpentry_finish', aliases: ['wall linings', 'internal walls'] }
    ]
  },

  // Location terminology - critical for zone identification
  locations: {
    buildings: [
      { term: 'basement', category: 'location_level', aliases: ['basement level', 'lower level'] },
      { term: 'building 3', category: 'location_building', aliases: ['bldg 3', 'block 3'] },
      { term: 'building 2', category: 'location_building', aliases: ['bldg 2', 'block 2'] },
      { term: 'level 1', category: 'location_level', aliases: ['first floor', 'level 01'] },
      { term: 'ground floor', category: 'location_level', aliases: ['ground level', 'GL'] },
      { term: 'roof level', category: 'location_level', aliases: ['roof', 'top level'] }
    ],
    areas: [
      { term: 'north wing', category: 'location_area', aliases: ['northern wing', 'north block'] },
      { term: 'south block', category: 'location_area', aliases: ['southern block', 'south wing'] },
      { term: 'car park', category: 'location_area', aliases: ['parking', 'carpark'] },
      { term: 'plant room', category: 'location_technical', aliases: ['plant', 'mechanical room'] },
      { term: 'services', category: 'location_technical', aliases: ['service areas', 'utilities'] },
      { term: 'common areas', category: 'location_area', aliases: ['common area', 'shared spaces'] }
    ],
    zones: [
      { term: 'wet areas', category: 'location_zone', aliases: ['wet area', 'bathrooms'] },
      { term: 'external works', category: 'location_zone', aliases: ['external', 'outside works'] },
      { term: 'core', category: 'location_zone', aliases: ['building core', 'central core'] },
      { term: 'perimeter', category: 'location_zone', aliases: ['perimeter areas', 'edge'] },
      { term: 'amenities', category: 'location_amenity', aliases: ['facilities', 'amenity'] },
      { term: 'circulation', category: 'location_circulation', aliases: ['corridors', 'walkways'] }
    ],
    australian_specific: [
      { term: 'lift wells', category: 'location_technical', aliases: ['elevator shaft', 'lift shaft'] },
      { term: 'fire stairs', category: 'location_safety', aliases: ['fire escape', 'emergency stairs'] },
      { term: 'loading dock', category: 'location_service', aliases: ['loading bay', 'dock'] },
      { term: 'substation', category: 'location_technical', aliases: ['electrical substation', 'power'] },
      { term: 'switch room', category: 'location_technical', aliases: ['switchroom', 'electrical room'] }
    ]
  },

  // Trade activities - for activity detection
  activities: {
    general: [
      { term: 'rough in', category: 'trade_activity', aliases: ['roughing in', 'rough-in'] },
      { term: 'commissioning', category: 'trade_activity', aliases: ['commission', 'testing'] },
      { term: 'handover', category: 'project_milestone', aliases: ['hand over', 'completion'] },
      { term: 'practical completion', category: 'project_milestone', aliases: ['PC', 'practical comp'] },
      { term: 'defects liability', category: 'project_phase', aliases: ['defects period', 'warranty'] }
    ],
    supply: [
      { term: 'supply and install', category: 'trade_delivery', aliases: ['supply & install', 'S&I'] },
      { term: 'materials to site', category: 'trade_delivery', aliases: ['delivery to site', 'site delivery'] },
      { term: 'delivery of', category: 'trade_delivery', aliases: ['delivery', 'supply of'] }
    ],
    quality: [
      { term: 'inspection', category: 'qa_activity', aliases: ['inspect', 'check'] },
      { term: 'approval', category: 'qa_activity', aliases: ['approve', 'sign-off'] },
      { term: 'certification', category: 'qa_activity', aliases: ['certify', 'certificate'] },
      { term: 'sign-off', category: 'qa_activity', aliases: ['signoff', 'sign off'] }
    ],
    trade_types: [
      { term: 'wet trades', category: 'trade_classification', aliases: ['wet trade', 'concrete/render'] },
      { term: 'dry trades', category: 'trade_classification', aliases: ['dry trade', 'carpentry/electrical'] },
      { term: 'mechanical services', category: 'trade_classification', aliases: ['mechanical', 'HVAC'] },
      { term: 'hydraulic services', category: 'trade_classification', aliases: ['hydraulics', 'plumbing'] }
    ]
  }
};

// Enhanced pattern matching for Australian construction terms
const TERMINOLOGY_PATTERNS: TerminologyPattern[] = [
  // Carpentry patterns - high priority
  { pattern: /\bfit\s*off\b/gi, category: 'carpentry_activity', trade: 'carpentry', extractionHint: 'Final carpentry installation phase' },
  { pattern: /\bfix\s*out\b/gi, category: 'carpentry_activity', trade: 'carpentry', extractionHint: 'Final fitting and finishing' },
  { pattern: /\bdoor\s+install(?:ation)?\b/gi, category: 'carpentry_installation', trade: 'carpentry', extractionHint: 'Door installation activity' },
  { pattern: /\bdelivery\s+of\s+door\s+jambs?\b/gi, category: 'carpentry_delivery', trade: 'carpentry', extractionHint: 'Door jamb delivery milestone' },
  { pattern: /\bdelivery\s+of\s+skirting?s?\b/gi, category: 'carpentry_delivery', trade: 'carpentry', extractionHint: 'Skirting board delivery' },
  { pattern: /\barchitrave?s?\b/gi, category: 'carpentry_component', trade: 'carpentry', extractionHint: 'Door and window trim installation' },
  { pattern: /\bcornice?s?\b/gi, category: 'carpentry_component', trade: 'carpentry', extractionHint: 'Ceiling cornice installation' },
  
  // Location patterns - critical for zone mapping
  { pattern: /\bbasement\b/gi, category: 'location_level', extractionHint: 'Below ground level work area' },
  { pattern: /\bbuilding\s+(\d+|[a-z])\b/gi, category: 'location_building', extractionHint: 'Specific building reference' },
  { pattern: /\blevel\s+(\d+|ground|roof)\b/gi, category: 'location_level', extractionHint: 'Floor or level reference' },
  { pattern: /\b(?:north|south|east|west)\s+(?:wing|block|area)\b/gi, category: 'location_area', extractionHint: 'Directional building area' },
  { pattern: /\bcar\s*park\b/gi, category: 'location_area', extractionHint: 'Parking area work zone' },
  { pattern: /\bplant\s+room\b/gi, category: 'location_technical', extractionHint: 'Mechanical/technical room' },
  { pattern: /\bwet\s+areas?\b/gi, category: 'location_zone', extractionHint: 'Bathroom/kitchen zones requiring waterproofing' },
  { pattern: /\bexternal\s+works?\b/gi, category: 'location_zone', extractionHint: 'Outside building work area' },
  
  // Trade activity patterns
  { pattern: /\bfirst\s+fix\b/gi, category: 'carpentry_phase', trade: 'carpentry', extractionHint: 'Initial carpentry rough-in phase' },
  { pattern: /\bsecond\s+fix\b/gi, category: 'carpentry_phase', trade: 'carpentry', extractionHint: 'Final carpentry finishing phase' },
  { pattern: /\brough\s*(?:ing)?\s*in\b/gi, category: 'trade_activity', extractionHint: 'Initial trade installation phase' },
  { pattern: /\bpractical\s+completion\b/gi, category: 'project_milestone', extractionHint: 'Major project milestone' },
  { pattern: /\bcommissioning\b/gi, category: 'trade_activity', extractionHint: 'System testing and handover' },
  { pattern: /\bsupply\s+(?:and|&)\s+install\b/gi, category: 'trade_delivery', extractionHint: 'Combined delivery and installation activity' },
  { pattern: /\bmaterials?\s+to\s+site\b/gi, category: 'trade_delivery', extractionHint: 'Material delivery milestone' },
  
  // Quality and approval patterns
  { pattern: /\binspection\b/gi, category: 'qa_activity', extractionHint: 'Quality inspection checkpoint' },
  { pattern: /\bapproval\b/gi, category: 'qa_activity', extractionHint: 'Approval milestone' },
  { pattern: /\bcertification\b/gi, category: 'qa_activity', extractionHint: 'Certification requirement' },
  { pattern: /\bsign[-\s]?off\b/gi, category: 'qa_activity', extractionHint: 'Final approval and sign-off' }
];

export const useAustralianConstructionTerms = () => {
  const [isLearning, setIsLearning] = useState(false);
  const [confidence, setConfidence] = useState(0);

  // Extract Australian construction terms from text
  const extractTermsFromText = (text: string): ConstructionTerm[] => {
    const extractedTerms: ConstructionTerm[] = [];
    let termConfidence = 0;
    let termCount = 0;

    TERMINOLOGY_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        matches.forEach((match, index) => {
          const term: ConstructionTerm = {
            id: `${pattern.category}_${termCount++}`,
            term: match.trim(),
            category: pattern.category,
            trade: pattern.trade,
            confidence: 0.8, // High confidence for pattern matches
            context: getContextAroundMatch(text, match),
            aliases: []
          };
          extractedTerms.push(term);
          termConfidence += 0.8;
        });
      }
    });

    // Calculate overall confidence based on term density and variety
    const textLength = text.length;
    const termDensity = extractedTerms.length / Math.max(textLength / 1000, 1); // Terms per 1000 chars
    const categoryVariety = new Set(extractedTerms.map(t => t.category)).size;
    
    setConfidence(Math.min(1.0, (termDensity * 0.5) + (categoryVariety * 0.1)));
    
    return extractedTerms;
  };

  // Get context around a matched term
  const getContextAroundMatch = (text: string, match: string): string => {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + match.length + 50);
    
    return text.substring(start, end).trim();
  };

  // Learn from successfully parsed documents
  const learnFromDocument = async (parsedData: any, organizationId: string) => {
    setIsLearning(true);
    
    try {
      // Extract learning patterns from successful parsing
      const learningPatterns = {
        carpentryTerms: [],
        locationTerms: [],
        tradeActivities: [],
        extractionContext: {
          milestonesCount: parsedData.milestones?.length || 0,
          tradesFound: parsedData.trades || [],
          zonesFound: parsedData.zones || [],
          confidence: parsedData.confidence || 0
        }
      };

      // Store learning patterns in the database for organization-specific improvements
      const { error } = await supabase
        .from('category_learning_patterns')
        .insert({
          organization_id: organizationId,
          trade_industry: 'construction_programme',
          pattern_data: learningPatterns,
          success_rate: parsedData.confidence,
          usage_count: 1
        });

      if (error) {
        console.error('Error storing learning patterns:', error);
      }
    } catch (error) {
      console.error('Error in learning process:', error);
    } finally {
      setIsLearning(false);
    }
  };

  // Get suggested improvements for document parsing
  const getSuggestedImprovements = (extractedTerms: ConstructionTerm[]): string[] => {
    const improvements = [];
    
    const carpentryTerms = extractedTerms.filter(t => t.category?.includes('carpentry'));
    const locationTerms = extractedTerms.filter(t => t.category?.includes('location'));
    const activityTerms = extractedTerms.filter(t => t.category?.includes('activity'));
    
    if (carpentryTerms.length === 0) {
      improvements.push('No carpentry terminology detected - document may not contain carpentry-specific activities');
    }
    
    if (locationTerms.length === 0) {
      improvements.push('No location references found - consider adding building/zone information');
    }
    
    if (activityTerms.length === 0) {
      improvements.push('No trade activities identified - document may need more specific activity descriptions');
    }
    
    if (confidence < 0.3) {
      improvements.push('Low Australian construction terminology confidence - document may not be construction-focused');
    }
    
    return improvements;
  };

  // Get trade-specific terminology suggestions
  const getTradeTerminologySuggestions = (trade: string): string[] => {
    const tradeTerms = AUSTRALIAN_CONSTRUCTION_TERMS.carpentry;
    
    switch (trade.toLowerCase()) {
      case 'carpentry':
        return [
          ...tradeTerms.primary.map(t => t.term),
          ...tradeTerms.phases.map(t => t.term),
          ...tradeTerms.structural.map(t => t.term)
        ];
      default:
        return ['No specific terminology available for this trade'];
    }
  };

  // Enhanced term matching with fuzzy logic
  const matchTermWithConfidence = (inputTerm: string): { match: string | null; confidence: number; category: string } => {
    const input = inputTerm.toLowerCase().trim();
    
    // Direct pattern matching first
    for (const pattern of TERMINOLOGY_PATTERNS) {
      if (pattern.pattern.test(input)) {
        return {
          match: inputTerm,
          confidence: 0.9,
          category: pattern.category
        };
      }
    }
    
    // Fuzzy matching for close variations - flatten all term groups
    const allTermGroups = [
      ...AUSTRALIAN_CONSTRUCTION_TERMS.carpentry.primary,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.carpentry.phases,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.carpentry.structural,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.locations.buildings,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.locations.areas,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.locations.zones,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.locations.australian_specific,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.activities.general,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.activities.supply,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.activities.quality,
      ...AUSTRALIAN_CONSTRUCTION_TERMS.activities.trade_types
    ];
    
    for (const termGroup of allTermGroups) {
      if (termGroup.term && input.includes(termGroup.term.toLowerCase())) {
        return {
          match: termGroup.term,
          confidence: 0.7,
          category: termGroup.category
        };
      }
      
      // Check aliases
      if (termGroup.aliases) {
        for (const alias of termGroup.aliases) {
          if (input.includes(alias.toLowerCase())) {
            return {
              match: termGroup.term,
              confidence: 0.6,
              category: termGroup.category
            };
          }
        }
      }
    }
    
    return { match: null, confidence: 0, category: 'unknown' };
  };

  return {
    extractTermsFromText,
    learnFromDocument,
    getSuggestedImprovements,
    getTradeTerminologySuggestions,
    matchTermWithConfidence,
    isLearning,
    confidence,
    terminologyDatabase: AUSTRALIAN_CONSTRUCTION_TERMS,
    patterns: TERMINOLOGY_PATTERNS
  };
};