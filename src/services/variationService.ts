
// Re-export the main service for backward compatibility
export { VariationService } from './variations/VariationService';

// Create and export the singleton instance
import { VariationService } from './variations/VariationService';
export const variationService = VariationService.getInstance();
