import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';

interface TooltipContext {
  component: string;
  action: string;
  userRole: string;
  data?: any;
  performance?: {
    loadTime: number;
    errorRate: number;
    userSatisfaction: number;
  };
}

interface AITooltipResponse {
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedActions?: string[];
  confidence: number;
}

export const useAITooltipAgent = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cache, setCache] = useState<Map<string, AITooltipResponse>>(new Map());
  const processingQueue = useRef<Map<string, Promise<AITooltipResponse>>>(new Map());
  const { toast } = useToast();

  // AI-powered tooltip generation
  const generateSmartTooltip = useCallback(async (context: TooltipContext): Promise<AITooltipResponse> => {
    const cacheKey = `${context.component}-${context.action}-${context.userRole}`;
    
    // Check cache first for instant response
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    
    // Check if already processing this context
    if (processingQueue.current.has(cacheKey)) {
      return processingQueue.current.get(cacheKey)!;
    }

    setIsProcessing(true);
    
    const processingPromise = new Promise<AITooltipResponse>(async (resolve) => {
      try {
        // Simulate AI processing with intelligent rules
        const response = await processAITooltip(context);
        
        // Cache the result
        setCache(prev => new Map(prev).set(cacheKey, response));
        
        resolve(response);
      } catch (error) {
        console.error('AI Tooltip processing error:', error);
        resolve({
          message: getFailsafeTooltip(context),
          priority: 'medium',
          actionable: false,
          confidence: 0.5
        });
      }
    });
    
    processingQueue.current.set(cacheKey, processingPromise);
    
    const result = await processingPromise;
    processingQueue.current.delete(cacheKey);
    setIsProcessing(false);
    
    return result;
  }, [cache]);

  // High-speed AI processing simulation
  const processAITooltip = async (context: TooltipContext): Promise<AITooltipResponse> => {
    // Process in background with minimal delay
    await new Promise(resolve => setTimeout(resolve, 50)); // Ultra-fast processing
    
    const { component, action, userRole, data, performance } = context;
    
    // AI-like pattern matching for context-aware tooltips
    if (component.includes('upload') && window.innerWidth < 768) {
      return {
        message: "📱 Mobile Upload Tip: Upload files in smaller batches for better performance. Tap and hold for batch selection.",
        priority: 'high',
        actionable: true,
        suggestedActions: ['Use WiFi for faster uploads', 'Upload 2-3 files at a time', 'Clear cache if slow'],
        confidence: 0.9
      };
    }
    
    if (component.includes('qa') && action === 'create') {
      return {
        message: "🔍 Smart QA Tip: Based on your project type, I recommend starting with these critical checkpoints. Auto-templates are loaded.",
        priority: 'medium',
        actionable: true,
        suggestedActions: ['Use auto-complete templates', 'Take photos as you inspect', 'Mark critical items first'],
        confidence: 0.85
      };
    }
    
    if (component.includes('audit') && action.includes('refresh')) {
      return {
        message: "⚡ Live Updates: Your audit trail now refreshes in real-time. Changes appear instantly across all devices.",
        priority: 'low',
        actionable: false,
        confidence: 0.95
      };
    }
    
    if (component.includes('variation') && action.includes('approve')) {
      const costImpact = data?.costImpact || 'unknown';
      return {
        message: `💰 Cost Impact Alert: This variation affects budget by ${costImpact}. Review financial implications before approval.`,
        priority: 'critical',
        actionable: true,
        suggestedActions: ['Review budget impact', 'Check project margins', 'Get financial approval if >$10k'],
        confidence: 0.92
      };
    }
    
    if (performance && performance.loadTime > 3000) {
      return {
        message: "🚀 Performance Boost: I've detected slow loading. Try refreshing or check your internet connection. Mobile users: consider WiFi.",
        priority: 'high',
        actionable: true,
        suggestedActions: ['Refresh page', 'Check internet connection', 'Clear browser cache'],
        confidence: 0.88
      };
    }
    
    // Default AI response
    return generateContextualTooltip(context);
  };

  const generateContextualTooltip = (context: TooltipContext): AITooltipResponse => {
    const { component, action, userRole } = context;
    
    // Role-based AI suggestions
    const roleBasedTips: Record<string, string> = {
      'project_manager': "📊 PM Insight: Track project metrics and team performance in real-time.",
      'supervisor': "👷 Site Tip: Use mobile capture for faster field documentation.",
      'estimator': "💰 Cost Focus: Monitor budget variations and forecast impacts.",
      'admin': "⚙️ Admin Power: Bulk operations and advanced settings available."
    };
    
    const baseMessage = roleBasedTips[userRole] || 
                       "💡 Smart Tip: Optimized workflows available for your current task.";
    
    return {
      message: `${baseMessage} Component: ${component}, Action: ${action}`,
      priority: 'medium',
      actionable: true,
      suggestedActions: ['Explore shortcuts', 'Check help docs', 'Use keyboard shortcuts'],
      confidence: 0.7
    };
  };

  const getFailsafeTooltip = (context: TooltipContext): string => {
    return `💡 Quick Tip: You're working with ${context.component}. Need help? Check the documentation or contact support.`;
  };

  // Show AI-powered toast notification
  const showSmartTooltip = useCallback(async (context: TooltipContext) => {
    const response = await generateSmartTooltip(context);
    
    if (response.priority === 'critical' || response.priority === 'high') {
      toast({
        title: response.priority === 'critical' ? "🚨 Critical Alert" : "⚠️ Important",
        description: response.message,
        duration: response.priority === 'critical' ? 10000 : 6000,
      });
    }
    
    return response;
  }, [generateSmartTooltip, toast]);

  // Clear cache periodically to keep tips fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(new Map()); // Clear cache every 5 minutes
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    generateSmartTooltip,
    showSmartTooltip,
    isProcessing,
    clearCache: () => setCache(new Map())
  };
};
