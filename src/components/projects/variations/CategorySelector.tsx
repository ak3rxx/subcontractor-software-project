
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAITradeSuggestions } from '@/hooks/useAITradeSuggestions';
import { useSmartCategories } from '@/hooks/useSmartCategories';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedTrade: string;
  organizationId?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  selectedTrade,
  organizationId
}) => {
  const { getTradeCategories } = useAITradeSuggestions();
  const { categories } = useSmartCategories();
  
  const tradeCategories = selectedTrade ? getTradeCategories(selectedTrade) : [];
  
  // Filter organization categories that aren't already in trade categories
  const organizationCategories = categories.filter(
    cat => !tradeCategories.includes(cat.category_name)
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={!selectedTrade}
      >
        <SelectTrigger>
          <SelectValue placeholder={selectedTrade ? "Select category" : "Select trade first"} />
        </SelectTrigger>
        <SelectContent>
          {/* Trade-specific categories */}
          {tradeCategories.length > 0 && (
            <>
              {tradeCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                </SelectItem>
              ))}
              {organizationCategories.length > 0 && (
                <SelectItem disabled value="_separator">
                  ── Organization Categories ──
                </SelectItem>
              )}
            </>
          )}
          
          {/* Organization-specific categories */}
          {organizationCategories.map((cat) => (
            <SelectItem key={cat.category_name} value={cat.category_name}>
              {cat.category_name} ({cat.usage_count} uses)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
