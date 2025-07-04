import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
}

interface AIAssistantProps {
  currentModule?: string;
  userContext?: {
    completedSteps?: string[];
    currentStep?: string;
  };
  isVisible?: boolean;
  onToggle?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  currentModule = 'dashboard',
  userContext = {},
  isVisible = false,
  onToggle
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user role from organization context
  const [userRole, setUserRole] = useState<string>('project_manager');
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      try {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('role, organizations(name)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
          
        if (orgUser) {
          setUserRole(orgUser.role);
          setOrganizationName(orgUser.organizations?.name || '');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  // Send welcome message when assistant opens
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      sendAIMessage('contextual_help', `Welcome to the ${currentModule} module! How can I help you get started?`);
    }
  }, [isVisible, currentModule]);

  const sendAIMessage = async (action: string, question?: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-onboarding-assistant', {
        body: {
          userRole,
          currentModule,
          userContext: {
            ...userContext,
            organizationName
          },
          question,
          action
        }
      });

      if (error) throw error;

      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions?.slice(0, 3) || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "AI Assistant Error",
        description: "Unable to connect to AI assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');

    await sendAIMessage('contextual_help', messageText);
  };

  const handleSuggestedAction = (action: string) => {
    sendAIMessage('suggest_workflow', action);
  };

  const handleQuickAction = (action: string) => {
    const actionMap = {
      'next_steps': 'What should I do next?',
      'explain_feature': `Explain the key features of ${currentModule}`,
      'workflow': `What's the recommended workflow for ${currentModule}?`
    };
    
    sendAIMessage(action as any, actionMap[action as keyof typeof actionMap]);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">AI Assistant</CardTitle>
            <p className="text-xs text-muted-foreground">{currentModule} guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            <ArrowRight className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-90' : '-rotate-90'}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 flex flex-col p-4 pt-0">
            {/* Quick Actions */}
            <div className="flex gap-1 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('next_steps')}
                className="text-xs"
              >
                Next Steps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('workflow')}
                className="text-xs"
              >
                Workflow
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 mb-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <p>{message.content}</p>
                      
                      {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs opacity-75 font-medium">Suggested actions:</p>
                          {message.suggestedActions.map((action, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="mr-1 mb-1 cursor-pointer hover:bg-secondary/80 text-xs"
                              onClick={() => handleSuggestedAction(action)}
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 mr-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isLoading || !inputValue.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default AIAssistant;