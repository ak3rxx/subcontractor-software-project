import { useState, useCallback, useMemo } from 'react';
import { ProgrammeMilestone } from './useProgrammeMilestones';
import { useProgrammeIntelligence } from './useProgrammeIntelligence';
import { useAustralianConstructionTerms } from './useAustralianConstructionTerms';

interface RealTimeIntelligenceData {
  lastUpdate: string;
  criticalPathStatus: 'on-track' | 'at-risk' | 'delayed';
  upcomingRisks: Array<{
    type: 'delay' | 'resource' | 'dependency' | 'weather';
    description: string;
    impact: 'low' | 'medium' | 'high';
    likelihood: number;
    suggestedAction: string;
  }>;
  performanceMetrics: {
    schedulePerformance: number; // % on time
    budgetAlignment: number; // % within budget  
    qualityScore: number; // QA inspection success rate
    riskLevel: 'low' | 'medium' | 'high';
  };
  automatedActions: Array<{
    action: string;
    reason: string;
    confidence: number;
    applied: boolean;
  }>;
}

export const useEnhancedProgrammeIntelligence = (projectId: string, milestones: ProgrammeMilestone[]) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeIntelligenceData | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'detailed' | 'comprehensive'>('detailed');
  
  const baseIntelligence = useProgrammeIntelligence();
  const constructionTerms = useAustralianConstructionTerms();

  // Enhanced critical path analysis with Australian construction patterns
  const enhancedCriticalPath = useMemo(() => {
    const basePath = baseIntelligence.calculateCriticalPath(milestones);
    
    // Apply Australian construction sequencing rules
    const enhancedPath = {
      ...basePath,
      constructionPhases: identifyAustralianConstructionPhases(milestones),
      tradeSequencing: analyzeTradeSequencing(milestones),
      inspectionGates: identifyInspectionGates(milestones),
      weatherRisks: assessWeatherRisks(milestones),
      permitDependencies: identifyPermitDependencies(milestones)
    };
    
    return enhancedPath;
  }, [milestones, baseIntelligence]);

  // Real-time monitoring and predictive analysis
  const analyzeRealTimeStatus = useCallback(async () => {
    if (!projectId || milestones.length === 0) return;

    try {
      // Simulate real-time analysis integration
      const analysis: RealTimeIntelligenceData = {
        lastUpdate: new Date().toISOString(),
        criticalPathStatus: determineCriticalPathStatus(milestones),
        upcomingRisks: identifyUpcomingRisks(milestones),
        performanceMetrics: calculatePerformanceMetrics(milestones),
        automatedActions: generateAutomatedActions(milestones)
      };

      setRealTimeData(analysis);
      return analysis;
    } catch (error) {
      console.error('Error in real-time analysis:', error);
      return null;
    }
  }, [projectId, milestones]);

  // Smart notification generation
  const generateSmartNotifications = useCallback(() => {
    if (!realTimeData) return [];

    const notifications = [];

    // Critical path notifications
    if (realTimeData.criticalPathStatus !== 'on-track') {
      notifications.push({
        type: 'critical-path',
        priority: 'high',
        title: 'Critical Path Alert',
        message: `Project critical path is ${realTimeData.criticalPathStatus}`,
        actions: ['view-critical-path', 'adjust-schedule']
      });
    }

    // Upcoming risk notifications
    realTimeData.upcomingRisks
      .filter(risk => risk.impact === 'high' && risk.likelihood > 0.7)
      .forEach(risk => {
        notifications.push({
          type: 'risk-alert',
          priority: 'medium',
          title: `Upcoming ${risk.type} Risk`,
          message: risk.description,
          actions: ['view-risk-details', 'apply-mitigation']
        });
      });

    // Performance notifications
    if (realTimeData.performanceMetrics.schedulePerformance < 0.8) {
      notifications.push({
        type: 'performance',
        priority: 'medium',
        title: 'Schedule Performance Warning',
        message: `Schedule performance at ${Math.round(realTimeData.performanceMetrics.schedulePerformance * 100)}%`,
        actions: ['view-performance', 'adjust-resources']
      });
    }

    return notifications;
  }, [realTimeData]);

  // Enhanced conflict detection with Australian construction context
  const detectEnhancedConflicts = useCallback(() => {
    const baseConflicts = baseIntelligence.detectConflicts(milestones);
    
    // Add Australian construction-specific conflict detection
    const australianConflicts = [
      ...detectTradeSequenceConflicts(milestones),
      ...detectInspectionConflicts(milestones),
      ...detectWeatherConflicts(milestones),
      ...detectPermitConflicts(milestones)
    ];

    return [...baseConflicts, ...australianConflicts];
  }, [milestones, baseIntelligence]);

  return {
    // Enhanced analysis
    enhancedCriticalPath,
    detectEnhancedConflicts,
    realTimeData,
    
    // Real-time features
    analyzeRealTimeStatus,
    generateSmartNotifications,
    
    // Configuration
    learningEnabled,
    setLearningEnabled,
    analysisDepth,
    setAnalysisDepth,
    
    // Base intelligence (fallback)
    ...baseIntelligence
  };
};

// Helper functions for Australian construction intelligence
function identifyAustralianConstructionPhases(milestones: ProgrammeMilestone[]) {
  const phases = [
    'Site Establishment',
    'Excavation & Earthworks', 
    'Foundations',
    'Structure & Frame',
    'Roof & Weatherproofing',
    'Services Rough-In',
    'Internal Fit-Out',
    'External Works',
    'Final Fix & Testing',
    'Handover & Commissioning'
  ];
  
  return milestones.map(milestone => {
    const phase = phases.find(p => 
      milestone.description?.toLowerCase().includes(p.toLowerCase()) ||
      milestone.milestone_name?.toLowerCase().includes(p.toLowerCase())
    );
    return { milestoneId: milestone.id, phase: phase || 'Unclassified' };
  });
}

function analyzeTradeSequencing(milestones: ProgrammeMilestone[]) {
  // Australian construction trade sequencing rules
  const tradeSequence = [
    'excavation', 'concrete', 'steel', 'roofing', 'electrical', 
    'plumbing', 'insulation', 'plasterboard', 'carpentry', 
    'tiling', 'painting', 'flooring', 'final electrical'
  ];

  return milestones
    .filter(m => m.trade)
    .map(milestone => ({
      milestoneId: milestone.id,
      trade: milestone.trade,
      sequenceOrder: tradeSequence.indexOf(milestone.trade?.toLowerCase() || '') + 1,
      predecessors: findTradePredecessors(milestone.trade!, tradeSequence),
      successors: findTradeSuccessors(milestone.trade!, tradeSequence)
    }));
}

function identifyInspectionGates(milestones: ProgrammeMilestone[]) {
  const inspectionKeywords = [
    'inspection', 'approval', 'certification', 'compliance',
    'sign-off', 'handover', 'commissioning', 'testing'
  ];

  return milestones.filter(milestone => 
    inspectionKeywords.some(keyword => 
      milestone.milestone_name?.toLowerCase().includes(keyword) ||
      milestone.description?.toLowerCase().includes(keyword)
    )
  ).map(milestone => ({
    milestoneId: milestone.id,
    inspectionType: determineInspectionType(milestone),
    isMandatory: true,
    regulatoryBody: determineRegulatoryBody(milestone)
  }));
}

function assessWeatherRisks(milestones: ProgrammeMilestone[]) {
  const weatherSensitiveTrades = ['concrete', 'roofing', 'external', 'painting'];
  
  return milestones
    .filter(m => weatherSensitiveTrades.some(trade => 
      m.trade?.toLowerCase().includes(trade) ||
      m.milestone_name?.toLowerCase().includes(trade)
    ))
    .map(milestone => ({
      milestoneId: milestone.id,
      weatherSensitivity: 'high',
      seasonalRisk: calculateSeasonalRisk(milestone.planned_date),
      mitigationOptions: ['covered work area', 'seasonal scheduling', 'weather protection']
    }));
}

function identifyPermitDependencies(milestones: ProgrammeMilestone[]) {
  const permitKeywords = ['permit', 'approval', 'council', 'certification', 'compliance'];
  
  return milestones.filter(milestone => 
    permitKeywords.some(keyword => 
      milestone.milestone_name?.toLowerCase().includes(keyword) ||
      milestone.description?.toLowerCase().includes(keyword)
    )
  );
}

// Conflict detection helpers
function detectTradeSequenceConflicts(milestones: ProgrammeMilestone[]) {
  // Implementation for trade sequence conflict detection
  return [];
}

function detectInspectionConflicts(milestones: ProgrammeMilestone[]) {
  // Implementation for inspection scheduling conflicts
  return [];
}

function detectWeatherConflicts(milestones: ProgrammeMilestone[]) {
  // Implementation for weather-related conflicts
  return [];
}

function detectPermitConflicts(milestones: ProgrammeMilestone[]) {
  // Implementation for permit dependency conflicts
  return [];
}

// Analysis helpers
function determineCriticalPathStatus(milestones: ProgrammeMilestone[]): 'on-track' | 'at-risk' | 'delayed' {
  const delayedMilestones = milestones.filter(m => m.status === 'delayed').length;
  if (delayedMilestones > 0) return 'delayed';
  
  const atRiskMilestones = milestones.filter(m => 
    new Date(m.planned_date!) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
    m.status === 'upcoming'
  ).length;
  
  return atRiskMilestones > 0 ? 'at-risk' : 'on-track';
}

function identifyUpcomingRisks(milestones: ProgrammeMilestone[]) {
  return []; // Implementation for risk identification
}

function calculatePerformanceMetrics(milestones: ProgrammeMilestone[]) {
  const completedOnTime = milestones.filter(m => m.status === 'complete').length;
  const total = milestones.length;
  
  return {
    schedulePerformance: total > 0 ? completedOnTime / total : 1,
    budgetAlignment: 0.95, // Would integrate with actual budget data
    qualityScore: 0.92, // Would integrate with QA data
    riskLevel: 'low' as const
  };
}

function generateAutomatedActions(milestones: ProgrammeMilestone[]) {
  return []; // Implementation for automated action generation
}

// Utility functions
function findTradePredecessors(trade: string, sequence: string[]): string[] {
  const index = sequence.indexOf(trade.toLowerCase());
  return index > 0 ? sequence.slice(0, index) : [];
}

function findTradeSuccessors(trade: string, sequence: string[]): string[] {
  const index = sequence.indexOf(trade.toLowerCase());
  return index >= 0 && index < sequence.length - 1 ? sequence.slice(index + 1) : [];
}

function determineInspectionType(milestone: ProgrammeMilestone): string {
  if (milestone.milestone_name?.toLowerCase().includes('frame')) return 'Frame Inspection';
  if (milestone.milestone_name?.toLowerCase().includes('foundation')) return 'Foundation Inspection';
  if (milestone.milestone_name?.toLowerCase().includes('final')) return 'Final Inspection';
  return 'Standard Inspection';
}

function determineRegulatoryBody(milestone: ProgrammeMilestone): string {
  return 'Local Council'; // Would determine based on inspection type
}

function calculateSeasonalRisk(date?: string): 'low' | 'medium' | 'high' {
  if (!date) return 'medium';
  
  const month = new Date(date).getMonth();
  // Australian seasons: Summer (Dec-Feb), Autumn (Mar-May), Winter (Jun-Aug), Spring (Sep-Nov)
  if (month >= 11 || month <= 1) return 'high'; // Summer - hot weather risks
  if (month >= 5 && month <= 7) return 'medium'; // Winter - rain risks
  return 'low'; // Autumn/Spring - optimal conditions
}