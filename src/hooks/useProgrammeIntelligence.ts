import { useState, useCallback, useMemo } from 'react';
import { ProgrammeMilestone } from './useProgrammeMilestones';
import { useToast } from './use-toast';

export interface MilestoneTemplate {
  id: string;
  name: string;
  trade: string;
  category: string;
  description: string;
  estimatedDuration: number; // days
  dependencies: string[]; // template IDs
  defaultPriority: 'low' | 'medium' | 'high';
  isCriticalPath: boolean;
  typicalSuccessors: string[];
}

export interface ConflictIssue {
  type: 'overlap' | 'impossible_timeline' | 'resource_conflict' | 'dependency_loop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  milestoneIds: string[];
  description: string;
  suggestion?: string;
}

export interface CriticalPathResult {
  path: string[];
  duration: number;
  riskFactors: string[];
  suggestions: string[];
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  // Foundation & Structural
  {
    id: 'site-establishment',
    name: 'Site Establishment',
    trade: 'general',
    category: 'Setup',
    description: 'Site access, fencing, facilities setup',
    estimatedDuration: 5,
    dependencies: [],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['excavation', 'temporary-services']
  },
  {
    id: 'excavation',
    name: 'Excavation Complete',
    trade: 'earthworks',
    category: 'Foundation',
    description: 'Site excavation and earthworks',
    estimatedDuration: 7,
    dependencies: ['site-establishment'],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['foundation-concrete']
  },
  {
    id: 'foundation-concrete',
    name: 'Foundation Concrete Pour',
    trade: 'concrete',
    category: 'Foundation',
    description: 'Foundation and slab concrete pour',
    estimatedDuration: 3,
    dependencies: ['excavation'],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['frame-erection']
  },
  {
    id: 'frame-erection',
    name: 'Frame Erection Complete',
    trade: 'steel',
    category: 'Structure',
    description: 'Structural frame assembly',
    estimatedDuration: 10,
    dependencies: ['foundation-concrete'],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['roof-structure', 'mechanical-rough-in']
  },
  
  // Services & Fit-out
  {
    id: 'electrical-rough-in',
    name: 'Electrical Rough-In',
    trade: 'electrical',
    category: 'Services',
    description: 'First fix electrical installation',
    estimatedDuration: 5,
    dependencies: ['frame-erection'],
    defaultPriority: 'medium',
    isCriticalPath: false,
    typicalSuccessors: ['wall-frames', 'electrical-final']
  },
  {
    id: 'plumbing-rough-in',
    name: 'Plumbing Rough-In',
    trade: 'plumbing',
    category: 'Services',
    description: 'First fix plumbing installation',
    estimatedDuration: 4,
    dependencies: ['frame-erection'],
    defaultPriority: 'medium',
    isCriticalPath: false,
    typicalSuccessors: ['wall-frames', 'plumbing-final']
  },
  {
    id: 'wall-frames',
    name: 'Wall Framing Complete',
    trade: 'carpentry',
    category: 'Structure',
    description: 'Internal wall framing',
    estimatedDuration: 8,
    dependencies: ['electrical-rough-in', 'plumbing-rough-in'],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['insulation', 'drywall']
  },
  {
    id: 'roof-structure',
    name: 'Roof Structure Complete',
    trade: 'carpentry',
    category: 'Structure',
    description: 'Roof trusses and structure',
    estimatedDuration: 6,
    dependencies: ['frame-erection'],
    defaultPriority: 'high',
    isCriticalPath: true,
    typicalSuccessors: ['roofing', 'gutters']
  },
  
  // Finishing
  {
    id: 'drywall',
    name: 'Drywall Installation',
    trade: 'drywall',
    category: 'Finishing',
    description: 'Drywall hanging and finishing',
    estimatedDuration: 7,
    dependencies: ['wall-frames'],
    defaultPriority: 'medium',
    isCriticalPath: true,
    typicalSuccessors: ['painting', 'flooring']
  },
  {
    id: 'flooring',
    name: 'Flooring Installation',
    trade: 'flooring',
    category: 'Finishing',
    description: 'Final floor coverings',
    estimatedDuration: 5,
    dependencies: ['drywall'],
    defaultPriority: 'medium',
    isCriticalPath: false,
    typicalSuccessors: ['final-cleanup']
  },
  {
    id: 'final-cleanup',
    name: 'Final Cleanup & Handover',
    trade: 'general',
    category: 'Completion',
    description: 'Site cleanup and project handover',
    estimatedDuration: 3,
    dependencies: ['flooring', 'electrical-final', 'plumbing-final'],
    defaultPriority: 'medium',
    isCriticalPath: true,
    typicalSuccessors: []
  }
];

export const useProgrammeIntelligence = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  // Critical Path Analysis
  const calculateCriticalPath = useCallback((milestones: ProgrammeMilestone[]): CriticalPathResult => {
    if (milestones.length === 0) {
      return { path: [], duration: 0, riskFactors: [], suggestions: [] };
    }

    // Build dependency graph
    const milestoneLookup = new Map(milestones.map(m => [m.id, m]));
    const visited = new Set<string>();
    const criticalPath: string[] = [];
    
    // Find milestones with no dependencies (start points)
    const startMilestones = milestones.filter(m => 
      !m.dependencies || m.dependencies.length === 0
    );

    if (startMilestones.length === 0) {
      return { 
        path: [], 
        duration: 0, 
        riskFactors: ['No starting milestone found'],
        suggestions: ['Add a milestone with no dependencies as project start'] 
      };
    }

    // Calculate longest path (critical path)
    const calculateLongestPath = (milestoneId: string, currentPath: string[] = []): { path: string[], duration: number } => {
      if (visited.has(milestoneId) || currentPath.includes(milestoneId)) {
        return { path: [], duration: 0 }; // Prevent cycles
      }

      const milestone = milestoneLookup.get(milestoneId);
      if (!milestone) return { path: [], duration: 0 };

      const newPath = [...currentPath, milestoneId];
      const milestoneDuration = milestone.start_date_planned && milestone.end_date_planned
        ? Math.ceil((new Date(milestone.end_date_planned).getTime() - new Date(milestone.start_date_planned).getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      // Find successors (milestones that depend on this one)
      const successors = milestones.filter(m => 
        m.dependencies && m.dependencies.includes(milestoneId)
      );

      if (successors.length === 0) {
        return { path: newPath, duration: milestoneDuration };
      }

      let longestSuccessorPath = { path: [], duration: 0 };
      for (const successor of successors) {
        const successorPath = calculateLongestPath(successor.id, newPath);
        if (successorPath.duration > longestSuccessorPath.duration) {
          longestSuccessorPath = successorPath;
        }
      }

      return {
        path: longestSuccessorPath.path,
        duration: milestoneDuration + longestSuccessorPath.duration
      };
    };

    // Find the longest path from all start points
    let criticalPathResult = { path: [], duration: 0 };
    for (const startMilestone of startMilestones) {
      const pathResult = calculateLongestPath(startMilestone.id);
      if (pathResult.duration > criticalPathResult.duration) {
        criticalPathResult = pathResult;
      }
    }

    // Identify risk factors
    const riskFactors: string[] = [];
    const suggestions: string[] = [];

    const criticalMilestones = criticalPathResult.path.map(id => milestoneLookup.get(id)).filter(Boolean) as ProgrammeMilestone[];
    
    // Check for delays on critical path
    const delayedCritical = criticalMilestones.filter(m => m.status === 'delayed');
    if (delayedCritical.length > 0) {
      riskFactors.push(`${delayedCritical.length} critical milestone(s) delayed`);
      suggestions.push('Focus resources on delayed critical milestones');
    }

    // Check for high-risk milestones
    const riskMilestones = criticalMilestones.filter(m => m.delay_risk_flag);
    if (riskMilestones.length > 0) {
      riskFactors.push(`${riskMilestones.length} critical milestone(s) flagged as high risk`);
      suggestions.push('Review risk mitigation plans for flagged milestones');
    }

    // Check for missing dependencies
    const missingDeps = criticalMilestones.filter(m => 
      m.dependencies && m.dependencies.some(depId => !milestoneLookup.has(depId))
    );
    if (missingDeps.length > 0) {
      riskFactors.push('Some dependencies reference missing milestones');
      suggestions.push('Review and update milestone dependencies');
    }

    return {
      path: criticalPathResult.path,
      duration: criticalPathResult.duration,
      riskFactors,
      suggestions
    };
  }, []);

  // Conflict Detection
  const detectConflicts = useCallback((milestones: ProgrammeMilestone[]): ConflictIssue[] => {
    const conflicts: ConflictIssue[] = [];

    // Check for schedule overlaps
    const scheduleConflicts = new Map<string, ProgrammeMilestone[]>();
    
    milestones.forEach(milestone => {
      if (milestone.trade && milestone.start_date_planned && milestone.end_date_planned) {
        if (!scheduleConflicts.has(milestone.trade)) {
          scheduleConflicts.set(milestone.trade, []);
        }
        scheduleConflicts.get(milestone.trade)!.push(milestone);
      }
    });

    // Detect overlapping milestones for same trade
    scheduleConflicts.forEach((tradeMilestones, trade) => {
      for (let i = 0; i < tradeMilestones.length; i++) {
        for (let j = i + 1; j < tradeMilestones.length; j++) {
          const m1 = tradeMilestones[i];
          const m2 = tradeMilestones[j];
          
          const start1 = new Date(m1.start_date_planned!);
          const end1 = new Date(m1.end_date_planned!);
          const start2 = new Date(m2.start_date_planned!);
          const end2 = new Date(m2.end_date_planned!);

          if ((start1 <= end2 && end1 >= start2)) {
            conflicts.push({
              type: 'overlap',
              severity: 'medium',
              milestoneIds: [m1.id, m2.id],
              description: `${trade} milestones "${m1.milestone_name}" and "${m2.milestone_name}" have overlapping schedules`,
              suggestion: 'Adjust dates or assign to different teams'
            });
          }
        }
      }
    });

    // Check for dependency cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (milestoneId: string): boolean => {
      if (recursionStack.has(milestoneId)) return true;
      if (visited.has(milestoneId)) return false;

      visited.add(milestoneId);
      recursionStack.add(milestoneId);

      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone?.dependencies) {
        for (const depId of milestone.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recursionStack.delete(milestoneId);
      return false;
    };

    milestones.forEach(milestone => {
      if (hasCycle(milestone.id)) {
        conflicts.push({
          type: 'dependency_loop',
          severity: 'critical',
          milestoneIds: [milestone.id],
          description: `Circular dependency detected involving "${milestone.milestone_name}"`,
          suggestion: 'Review and remove circular dependencies'
        });
      }
    });

    // Check for impossible timelines
    milestones.forEach(milestone => {
      if (milestone.dependencies && milestone.start_date_planned) {
        milestone.dependencies.forEach(depId => {
          const dependency = milestones.find(m => m.id === depId);
          if (dependency?.end_date_planned) {
            const depEnd = new Date(dependency.end_date_planned);
            const milestoneStart = new Date(milestone.start_date_planned!);
            
            if (milestoneStart < depEnd) {
              conflicts.push({
                type: 'impossible_timeline',
                severity: 'high',
                milestoneIds: [milestone.id, depId],
                description: `"${milestone.milestone_name}" starts before dependency "${dependency.milestone_name}" ends`,
                suggestion: 'Adjust start date or remove dependency'
              });
            }
          }
        });
      }
    });

    return conflicts;
  }, []);

  // Auto-populate dependencies based on templates and intelligent analysis
  const suggestDependencies = useCallback((milestone: Partial<ProgrammeMilestone>, existingMilestones: ProgrammeMilestone[]): string[] => {
    const suggestions: string[] = [];

    // Find matching template
    const template = MILESTONE_TEMPLATES.find(t => 
      t.trade === milestone.trade || 
      t.name.toLowerCase().includes(milestone.milestone_name?.toLowerCase() || '') ||
      milestone.milestone_name?.toLowerCase().includes(t.name.toLowerCase())
    );

    if (template) {
      // Map template dependencies to actual milestone IDs
      template.dependencies.forEach(templateDepId => {
        const depTemplate = MILESTONE_TEMPLATES.find(t => t.id === templateDepId);
        if (depTemplate) {
          // Find existing milestone that matches this dependency template
          const existingDep = existingMilestones.find(m => 
            m.trade === depTemplate.trade || 
            m.milestone_name.toLowerCase().includes(depTemplate.name.toLowerCase()) ||
            depTemplate.name.toLowerCase().includes(m.milestone_name.toLowerCase())
          );
          if (existingDep) {
            suggestions.push(existingDep.id);
          }
        }
      });
    }

    // Smart dependency detection based on common patterns
    if (milestone.trade) {
      const tradeDependencyMap: Record<string, string[]> = {
        'electrical': ['frame-erection', 'wall-frames'],
        'plumbing': ['frame-erection', 'wall-frames'],
        'drywall': ['electrical', 'plumbing', 'insulation'],
        'painting': ['drywall'],
        'flooring': ['painting', 'drywall'],
        'carpentry': ['frame-erection']
      };

      const expectedDeps = tradeDependencyMap[milestone.trade.toLowerCase()];
      if (expectedDeps) {
        expectedDeps.forEach(depTrade => {
          const existingDep = existingMilestones.find(m => 
            m.trade?.toLowerCase().includes(depTrade) ||
            m.milestone_name.toLowerCase().includes(depTrade)
          );
          if (existingDep && !suggestions.includes(existingDep.id)) {
            suggestions.push(existingDep.id);
          }
        });
      }
    }

    return suggestions;
  }, []);

  // Create milestones from template
  const createFromTemplate = useCallback((templateId: string, projectId: string, startDate?: string): Partial<ProgrammeMilestone> => {
    const template = MILESTONE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + template.estimatedDuration);

    return {
      project_id: projectId,
      milestone_name: template.name,
      description: template.description,
      trade: template.trade,
      category: template.category,
      priority: template.defaultPriority,
      critical_path: template.isCriticalPath,
      start_date_planned: start.toISOString().split('T')[0],
      end_date_planned: end.toISOString().split('T')[0],
      planned_date: start.toISOString().split('T')[0],
      status: 'upcoming' as const,
      completion_percentage: 0,
      delay_risk_flag: false,
      dependencies: [] // Will be populated separately
    };
  }, []);

  // Bulk create template-based programme
  const createTemplateBasedProgramme = useCallback(async (
    projectId: string, 
    projectType: 'residential' | 'commercial' | 'industrial' = 'residential',
    startDate?: string
  ): Promise<Partial<ProgrammeMilestone>[]> => {
    setAnalyzing(true);
    try {
      const start = startDate ? new Date(startDate) : new Date();
      const milestones: Partial<ProgrammeMilestone>[] = [];
      
      // Filter templates based on project type
      const relevantTemplates = MILESTONE_TEMPLATES.filter(template => {
        if (projectType === 'residential') {
          return !['industrial-specific', 'commercial-only'].includes(template.category);
        }
        return true; // Include all for commercial/industrial
      });

      let currentDate = new Date(start);
      
      // Create milestones in dependency order
      const processedTemplates = new Set<string>();
      const createMilestoneFromTemplate = (template: MilestoneTemplate): Partial<ProgrammeMilestone> => {
        if (processedTemplates.has(template.id)) {
          return milestones.find(m => m.milestone_name === template.name)!;
        }

        // Ensure dependencies are created first
        const dependencyMilestones: string[] = [];
        template.dependencies.forEach(depId => {
          const depTemplate = MILESTONE_TEMPLATES.find(t => t.id === depId);
          if (depTemplate) {
            const depMilestone = createMilestoneFromTemplate(depTemplate);
            if (depMilestone.id) {
              dependencyMilestones.push(depMilestone.id);
            }
          }
        });

        // Calculate start date based on dependencies
        let milestoneStart = new Date(currentDate);
        if (dependencyMilestones.length > 0) {
          // Find latest dependency end date
          const latestDepEnd = dependencyMilestones.reduce((latest, depId) => {
            const depMilestone = milestones.find(m => m.id === depId);
            if (depMilestone?.end_date_planned) {
              const depEnd = new Date(depMilestone.end_date_planned);
              return depEnd > latest ? depEnd : latest;
            }
            return latest;
          }, milestoneStart);
          
          milestoneStart = new Date(latestDepEnd);
          milestoneStart.setDate(milestoneStart.getDate() + 1); // Start day after dependency
        }

        const milestoneEnd = new Date(milestoneStart);
        milestoneEnd.setDate(milestoneEnd.getDate() + template.estimatedDuration);

        const milestone: Partial<ProgrammeMilestone> = {
          id: `temp-${Date.now()}-${Math.random()}`,
          project_id: projectId,
          milestone_name: template.name,
          description: template.description,
          trade: template.trade,
          category: template.category,
          priority: template.defaultPriority,
          critical_path: template.isCriticalPath,
          start_date_planned: milestoneStart.toISOString().split('T')[0],
          end_date_planned: milestoneEnd.toISOString().split('T')[0],
          planned_date: milestoneStart.toISOString().split('T')[0],
          status: 'upcoming' as const,
          completion_percentage: 0,
          delay_risk_flag: false,
          dependencies: dependencyMilestones
        };

        milestones.push(milestone);
        processedTemplates.add(template.id);
        
        // Update current date for next milestone
        if (milestoneEnd > currentDate) {
          currentDate = milestoneEnd;
        }

        return milestone;
      };

      // Process all templates
      relevantTemplates.forEach(template => {
        createMilestoneFromTemplate(template);
      });

      toast({
        title: "Success",
        description: `Created ${milestones.length} template-based milestones`
      });

      return milestones;
    } finally {
      setAnalyzing(false);
    }
  }, [toast]);

  return {
    analyzing,
    calculateCriticalPath,
    detectConflicts,
    suggestDependencies,
    createFromTemplate,
    createTemplateBasedProgramme,
    MILESTONE_TEMPLATES
  };
};