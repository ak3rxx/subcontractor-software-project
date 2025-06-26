
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TradeSuggestion {
  suggested_trade: string;
  confidence: number;
}

export const useAITradeSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const suggestTrade = async (description: string, organizationId: string): Promise<TradeSuggestion> => {
    if (!description || !organizationId) {
      return { suggested_trade: 'other', confidence: 0 };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('suggest_trade_from_description', {
          description_text: description,
          org_id: organizationId
        });

      if (error) {
        console.error('Error suggesting trade:', error);
        return { suggested_trade: 'other', confidence: 0 };
      }

      const result = data?.[0] || { suggested_trade: 'other', confidence: 0 };
      
      // Show feedback if confidence is high
      if (result.confidence > 0.7) {
        toast({
          title: "AI Trade Suggestion",
          description: `Detected "${result.suggested_trade}" trade (${Math.round(result.confidence * 100)}% confidence)`,
        });
      }

      return result;
    } catch (error) {
      console.error('Error:', error);
      return { suggested_trade: 'other', confidence: 0 };
    } finally {
      setLoading(false);
    }
  };

  const getTradeCategories = (trade: string): string[] => {
    const tradeCategories: Record<string, string[]> = {
      'carpentry': ['framing', 'trim_work', 'cabinetry', 'doors_windows', 'formwork'],
      'tiling': ['floor_tiles', 'wall_tiles', 'waterproofing_tiling', 'grouting', 'tile_repairs'],
      'painting': ['surface_prep', 'primer', 'interior_painting', 'exterior_painting', 'specialty_coatings'],
      'rendering': ['base_coat', 'float_coat', 'texture_coat', 'acrylic_render', 'cement_render'],
      'builder': ['coordination', 'supervision', 'quality_control', 'project_management', 'compliance'],
      'electrical': ['power_points', 'lighting', 'distribution_boards', 'cabling', 'testing'],
      'plumbing': ['fixtures', 'pipework', 'drainage', 'hot_water', 'gas_services'],
      'hvac': ['ductwork', 'equipment', 'controls', 'commissioning', 'maintenance'],
      'partitions': ['wall_framing', 'ceiling', 'patching', 'sheeting', 'feature_items'],
      'flooring': ['preparation', 'installation', 'finishing', 'repairs', 'transitions'],
      'roofing': ['structure', 'waterproofing', 'gutters', 'flashing', 'insulation'],
      'structural': ['concrete', 'steel', 'timber', 'reinforcement', 'connections'],
      'finishes': ['painting', 'tiling', 'plastering', 'joinery', 'hardware'],
      'fire_services': ['detection', 'suppression', 'exits', 'doors', 'certification'],
      'landscaping': ['softworks', 'hardworks', 'irrigation', 'lighting_landscape', 'maintenance_landscape']
    };

    return tradeCategories[trade] || ['other'];
  };

  const getAllTrades = (): string[] => {
    return [
      'partitions', 'electrical', 'plumbing', 'hvac', 'flooring',
      'roofing', 'structural', 'finishes', 'fire_services', 'landscaping',
      'carpentry', 'tiling', 'painting', 'rendering', 'builder', 'other'
    ];
  };

  return {
    suggestTrade,
    getTradeCategories,
    getAllTrades,
    loading
  };
};
