import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Upload, FileText, Lightbulb, NavigationIcon, Brain } from 'lucide-react';
import { useSmartNotifications, SmartNotification } from '@/hooks/useSmartNotifications';
import { useAITooltipAgent } from '@/hooks/useAITooltipAgent';

const NotificationIcon: React.FC<{ type: SmartNotification['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'progress':
      return <Upload className="h-4 w-4 text-blue-600" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'file-upload':
      return <Upload className="h-3 w-3" />;
    case 'form-validation':
      return <FileText className="h-3 w-3" />;
    case 'contextual-help':
      return <Lightbulb className="h-3 w-3" />;
    case 'process-guide':
      return <NavigationIcon className="h-3 w-3" />;
    default:
      return null;
  }
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'file-upload':
      return 'bg-blue-100 text-blue-800';
    case 'form-validation':
      return 'bg-yellow-100 text-yellow-800';
    case 'contextual-help':
      return 'bg-green-100 text-green-800';
    case 'process-guide':
      return 'bg-purple-100 text-purple-800';
    case 'form-milestone':
      return 'bg-emerald-100 text-emerald-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const EnhancedNotificationTooltip: React.FC = () => {
  const { notifications, markAsRead, markAsDismissed } = useSmartNotifications();
  const { generateSmartTooltip, isProcessing } = useAITooltipAgent();
  const [currentNotification, setCurrentNotification] = useState<SmartNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  // AI-enhanced notification display with super-fast processing
  useEffect(() => {
    const visibleNotification = notifications.find(n => 
      !n.dismissed && 
      !n.read && 
      (n.priority === 'high' || n.priority === 'critical' || n.type === 'progress')
    );

    if (visibleNotification && (!currentNotification || visibleNotification.id !== currentNotification.id)) {
      // AI enhancement for critical notifications
      const enhanceNotification = async () => {
        if (visibleNotification.priority === 'critical' || visibleNotification.priority === 'high') {
          try {
            const aiResponse = await generateSmartTooltip({
              component: 'notification-tooltip',
              action: 'critical-display',
              userRole: 'user',
              data: { originalMessage: visibleNotification.message, priority: visibleNotification.priority }
            });
            
            if (aiResponse.confidence > 0.8) {
              setAiEnhanced(true);
              visibleNotification.message = `🧠 ${aiResponse.message}`;
            }
          } catch (error) {
            console.log('AI enhancement skipped:', error);
          }
        }
      };
      
      enhanceNotification();
      setCurrentNotification(visibleNotification);
      setIsVisible(true);
      
      // Optimized timing for mobile and AI-enhanced notifications
      const isMobile = window.innerWidth < 768;
      const baseTiming = isMobile ? 3000 : 5000;
      const timing = aiEnhanced ? baseTiming * 1.5 : baseTiming;
      
      if (visibleNotification.type === 'success' && visibleNotification.priority === 'low') {
        setTimeout(() => {
          markAsDismissed(visibleNotification.id);
          setIsVisible(false);
          setAiEnhanced(false);
        }, timing);
      }
    } else if (!visibleNotification && currentNotification) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentNotification(null);
        setAiEnhanced(false);
      }, 200);
    }
  }, [notifications, currentNotification, markAsDismissed, generateSmartTooltip, aiEnhanced]);

  const handleDismiss = () => {
    if (currentNotification) {
      markAsDismissed(currentNotification.id);
      setIsVisible(false);
    }
  };

  const handleAction = (actionFn: () => void) => {
    if (currentNotification) {
      markAsRead(currentNotification.id);
      actionFn();
    }
  };

  if (!currentNotification || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-2 duration-200">
      <Card className={`shadow-lg border-l-4 transition-all duration-200 ${
        aiEnhanced ? 'ring-2 ring-purple-400 ring-opacity-50 shadow-xl' : ''
      } ${
        currentNotification.type === 'error' ? 'border-l-red-500 bg-red-50' :
        currentNotification.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
        currentNotification.type === 'success' ? 'border-l-green-500 bg-green-50' :
        currentNotification.type === 'progress' ? 'border-l-blue-500 bg-blue-50' :
        'border-l-blue-500 bg-blue-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {aiEnhanced ? <Brain className="h-4 w-4 text-purple-600 animate-pulse" /> : <NotificationIcon type={currentNotification.type} />}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{currentNotification.title}</h4>
                  {currentNotification.category && (
                    <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getCategoryColor(currentNotification.category)}`}>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(currentNotification.category)}
                        <span>{currentNotification.category.replace('-', ' ')}</span>
                      </div>
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{currentNotification.message}</p>
                
                {/* Progress bar for upload notifications */}
                {currentNotification.type === 'progress' && currentNotification.progress !== undefined && (
                  <div className="mb-2">
                    <Progress value={currentNotification.progress} className="h-2" />
                    {currentNotification.progressText && (
                      <p className="text-xs text-gray-500 mt-1">{currentNotification.progressText}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {currentNotification.actions && currentNotification.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {currentNotification.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || "outline"}
                        size="sm"
                        onClick={() => handleAction(action.action)}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 ml-2 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNotificationTooltip;