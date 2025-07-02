
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Wrench, Brain } from 'lucide-react';
import { useAITradeSuggestions } from '@/hooks/useAITradeSuggestions';

interface SmartTradeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  description?: string;
  organizationId?: string;
  showAISuggestion?: boolean;
  disabled?: boolean;
}

const SmartTradeSelector: React.FC<SmartTradeSelectorProps> = ({
  value,
  onChange,
  description,
  organizationId,
  showAISuggestion = true,
  disabled = false
}) => {
  const { getAllTrades, suggestTrade, loading } = useAITradeSuggestions();
  const [aiSuggestion, setAISuggestion] = React.useState<{ trade: string; confidence: number } | null>(null);

  React.useEffect(() => {
    const getSuggestion = async () => {
      if (description && organizationId && description.length > 10 && !value && showAISuggestion && !disabled) {
        const result = await suggestTrade(description, organizationId);
        if (result.confidence > 0.3) {
          setAISuggestion({ trade: result.suggested_trade, confidence: result.confidence });
        }
      }
    };

    const timeoutId = setTimeout(getSuggestion, 1000);
    return () => clearTimeout(timeoutId);
  }, [description, organizationId, value, showAISuggestion, disabled, suggestTrade]);

  const handleTradeSelect = (selectedTrade: string) => {
    if (!disabled) {
      onChange(selectedTrade);
      setAISuggestion(null);
    }
  };

  const acceptAISuggestion = () => {
    if (aiSuggestion && !disabled) {
      onChange(aiSuggestion.trade);
      setAISuggestion(null);
    }
  };

  const allTrades = getAllTrades();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Trade *
        </Label>
        {loading && !disabled && (
          <Badge variant="outline" className="text-blue-600">
            <Brain className="h-3 w-3 mr-1" />
            AI Analyzing...
          </Badge>
        )}
      </div>

      <Select value={value} onValueChange={handleTradeSelect} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select trade type" />
        </SelectTrigger>
        <SelectContent>
          {allTrades.map((trade) => (
            <SelectItem key={trade} value={trade}>
              {trade.charAt(0).toUpperCase() + trade.slice(1).replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {aiSuggestion && !disabled && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                AI Suggestion: {aiSuggestion.trade.charAt(0).toUpperCase() + aiSuggestion.trade.slice(1)}
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(aiSuggestion.confidence * 100)}% confidence
              </Badge>
            </div>
            <button
              type="button"
              onClick={acceptAISuggestion}
              className="text-xs text-purple-600 hover:text-purple-800 underline"
              disabled={disabled}
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {!value && !aiSuggestion && description && !disabled && (
        <p className="text-sm text-gray-500">💡 Tip: Add description above for AI trade suggestion</p>
      )}
    </div>
  );
};

export default SmartTradeSelector;
