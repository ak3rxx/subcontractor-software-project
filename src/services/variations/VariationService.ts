
import { Variation, VariationFormData } from '@/types/variations';
import { VariationDataService } from './VariationDataService';
import { VariationCRUDService } from './VariationCRUDService';
import { VariationEmailService } from './VariationEmailService';
import { VariationAuditService } from './VariationAuditService';
import { VariationCacheService } from './VariationCacheService';

export class VariationService {
  private static instance: VariationService;
  private cacheService: VariationCacheService;
  private auditService: VariationAuditService;
  private dataService: VariationDataService;
  private crudService: VariationCRUDService;
  private emailService: VariationEmailService;

  private constructor() {
    this.cacheService = new VariationCacheService();
    this.auditService = new VariationAuditService();
    this.dataService = new VariationDataService(this.cacheService);
    this.crudService = new VariationCRUDService(this.cacheService, this.auditService);
    this.emailService = new VariationEmailService(this.auditService);
  }

  static getInstance(): VariationService {
    if (!VariationService.instance) {
      VariationService.instance = new VariationService();
    }
    return VariationService.instance;
  }

  async fetchVariations(projectId: string, forceRefresh = false): Promise<Variation[]> {
    return this.dataService.fetchVariations(projectId, forceRefresh);
  }

  async createVariation(
    projectId: string, 
    formData: VariationFormData, 
    userId: string
  ): Promise<Variation> {
    return this.crudService.createVariation(projectId, formData, userId);
  }

  async updateVariation(
    id: string, 
    updates: Partial<Variation>, 
    userId: string
  ): Promise<Variation> {
    const updatedVariation = await this.crudService.updateVariation(id, updates, userId);
    
    // Update email status if needed
    if (updates.email_sent !== undefined) {
      const emailUpdates = {
        email_sent: updates.email_sent,
        email_sent_date: updates.email_sent_date,
        email_sent_by: updates.email_sent_by
      };
      
      await this.crudService.updateVariation(id, emailUpdates, userId);
    }
    
    return updatedVariation;
  }

  async sendVariationEmail(variation: Variation, userId: string): Promise<boolean> {
    const success = await this.emailService.sendVariationEmail(variation, userId);
    
    if (success) {
      // Update variation with email sent status
      await this.updateVariation(variation.id, {
        email_sent: true,
        email_sent_date: new Date().toISOString(),
        email_sent_by: userId
      }, userId);
    }
    
    return success;
  }

  clearAllCache(): void {
    this.cacheService.clear();
  }
}
