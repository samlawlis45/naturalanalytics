import { prisma } from './prisma';
import crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in minutes (default: 60)
  forceRefresh?: boolean; // Force refresh even if cache exists
}

export interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  cachedAt?: Date;
  expiresAt?: Date;
}

export class DataCache {
  private static generateCacheKey(query: string, dataSourceId?: string): string {
    const content = `${query}:${dataSourceId || 'default'}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  static async get<T = Record<string, unknown>>(
    query: string, 
    dataSourceId?: string
  ): Promise<CacheResult<T> | null> {
    try {
      const cacheKey = this.generateCacheKey(query, dataSourceId);
      
      const cached = await prisma.dataSourceCache.findUnique({
        where: { cacheKey },
      });

      if (!cached) {
        return null;
      }

      // Check if cache is expired
      if (cached.expiresAt && cached.expiresAt < new Date()) {
        // Delete expired cache
        await prisma.dataSourceCache.delete({
          where: { id: cached.id },
        });
        return null;
      }

      // Update hit count and last hit time
      await prisma.dataSourceCache.update({
        where: { id: cached.id },
        data: {
          hitCount: { increment: 1 },
          lastHitAt: new Date(),
        },
      });

      return {
        data: cached.result as T,
        fromCache: true,
        cachedAt: cached.createdAt,
        expiresAt: cached.expiresAt,
      };

    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  static async set<T = Record<string, unknown>>(
    query: string,
    data: T,
    options: CacheOptions = {},
    dataSourceId?: string
  ): Promise<void> {
    try {
      const { ttl = 60 } = options;
      const cacheKey = this.generateCacheKey(query, dataSourceId);
      const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
      
      const recordCount = Array.isArray(data) ? data.length : 1;

      await prisma.dataSourceCache.upsert({
        where: { cacheKey },
        update: {
          result: data as unknown,
          recordCount,
          expiresAt,
          updatedAt: new Date(),
          hitCount: 0, // Reset hit count on update
          lastHitAt: null,
        },
        create: {
          cacheKey,
          sqlQuery: query,
          dataSourceId,
          result: data as unknown,
          recordCount,
          expiresAt,
        },
      });

    } catch (error) {
      console.error('Error writing to cache:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  static async invalidate(query: string, dataSourceId?: string): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query, dataSourceId);
      
      await prisma.dataSourceCache.deleteMany({
        where: { cacheKey },
      });

    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  static async invalidateDataSource(dataSourceId: string): Promise<void> {
    try {
      await prisma.dataSourceCache.deleteMany({
        where: { dataSourceId },
      });

    } catch (error) {
      console.error('Error invalidating data source cache:', error);
    }
  }

  static async getStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    hitRate: number;
    cacheSize: number;
  }> {
    try {
      const stats = await prisma.dataSourceCache.aggregate({
        _count: { id: true },
        _sum: { 
          hitCount: true,
          recordCount: true,
        },
      });

      const totalEntries = stats._count.id || 0;
      const totalHits = stats._sum.hitCount || 0;
      const totalRecords = stats._sum.recordCount || 0;

      // Calculate hit rate (hits per entry)
      const hitRate = totalEntries > 0 ? totalHits / totalEntries : 0;

      return {
        totalEntries,
        totalHits,
        hitRate: Math.round(hitRate * 100) / 100,
        cacheSize: totalRecords,
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        hitRate: 0,
        cacheSize: 0,
      };
    }
  }

  static async cleanup(): Promise<number> {
    try {
      // Delete expired entries
      const result = await prisma.dataSourceCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;

    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }

  static async clear(): Promise<number> {
    try {
      const result = await prisma.dataSourceCache.deleteMany({});
      return result.count;

    } catch (error) {
      console.error('Error clearing cache:', error);
      return 0;
    }
  }
}

// Helper function to cache query results
export async function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
  dataSourceId?: string
): Promise<CacheResult<T>> {
  const { forceRefresh = false } = options;

  // Try to get from cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await DataCache.get<T>(cacheKey, dataSourceId);
    if (cached) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await DataCache.set(cacheKey, data, options, dataSourceId);

  return {
    data,
    fromCache: false,
  };
}