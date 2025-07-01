
export class VariationCacheService {
  private cache = new Map<string, { data: any[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getCacheKey(projectId: string): string {
    return `variations_${projectId}`;
  }

  get(projectId: string): any[] | null {
    const cacheKey = this.getCacheKey(projectId);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  set(projectId: string, data: any[]): void {
    const cacheKey = this.getCacheKey(projectId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  clear(projectId?: string): void {
    if (projectId) {
      this.cache.delete(this.getCacheKey(projectId));
    } else {
      this.cache.clear();
    }
  }
}
