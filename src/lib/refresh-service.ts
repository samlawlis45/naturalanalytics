import { prisma } from './prisma';
import { DataCache } from './cache';

interface RefreshResult {
  success: boolean;
  recordsAffected: number;
  metadata: Record<string, unknown>;
  error?: string;
}

export class RefreshService {
  static async refreshDashboard(dashboardId: string, userId: string): Promise<RefreshResult> {
    try {
      const dashboard = await prisma.dashboard.findFirst({
        where: { id: dashboardId, userId },
      });

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Invalidate any cached data for this dashboard
      await DataCache.invalidateDataSource(`dashboard-${dashboardId}`);

      // Update dashboard timestamp
      await prisma.dashboard.update({
        where: { id: dashboardId },
        data: { updatedAt: new Date() },
      });

      return {
        success: true,
        recordsAffected: 1,
        metadata: {
          type: 'dashboard',
          dashboardId,
          refreshedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async refreshQuery(queryId: string, userId: string): Promise<RefreshResult> {
    try {
      const query = await prisma.query.findFirst({
        where: { id: queryId, userId },
        include: { dataSource: true },
      });

      if (!query) {
        throw new Error('Query not found');
      }

      // Invalidate cached results for this query
      if (query.sqlQuery) {
        await DataCache.invalidate(query.sqlQuery, query.dataSource?.id);
      }

      // Update query timestamp and status
      await prisma.query.update({
        where: { id: queryId },
        data: { 
          updatedAt: new Date(),
          status: 'COMPLETED',
        },
      });

      return {
        success: true,
        recordsAffected: 1,
        metadata: {
          type: 'query',
          queryId,
          sqlQuery: query.sqlQuery,
          refreshedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async executeSchedule(scheduleId: string): Promise<RefreshResult> {
    try {
      const schedule = await prisma.refreshSchedule.findUnique({
        where: { id: scheduleId },
        include: { user: true },
      });

      if (!schedule || !schedule.isActive) {
        throw new Error('Schedule not found or inactive');
      }

      let result: RefreshResult;
      
      if (schedule.targetType === 'DASHBOARD') {
        result = await this.refreshDashboard(schedule.targetId, schedule.userId);
      } else if (schedule.targetType === 'QUERY') {
        result = await this.refreshQuery(schedule.targetId, schedule.userId);
      } else {
        throw new Error(`Unsupported target type: ${schedule.targetType}`);
      }

      // Update schedule metadata
      const now = new Date();
      let nextRunAt: Date | null = null;

      if (schedule.scheduleType === 'INTERVAL' && schedule.interval) {
        nextRunAt = new Date(now.getTime() + schedule.interval * 60 * 1000);
      } else if (schedule.scheduleType === 'CRON' && schedule.cronExpression) {
        // Simple cron parsing for common patterns
        nextRunAt = this.calculateNextCronRun(schedule.cronExpression);
      }

      await prisma.refreshSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: now,
          nextRunAt,
          runCount: { increment: 1 },
          ...(result.success 
            ? { lastError: null } 
            : { errorCount: { increment: 1 }, lastError: result.error }
          ),
        },
      });

      return result;
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        metadata: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static calculateNextCronRun(cronExpression: string): Date {
    // Use the CronUtils for more accurate parsing
    const { CronUtils } = import('./cron-utils');
    
    // Simple fallback parsing for common patterns
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      return new Date(Date.now() + 60 * 60 * 1000);
    }

    const [minute, hour] = parts;
    const now = new Date();
    
    if (minute !== '*' && hour !== '*') {
      const next = new Date(now);
      next.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    }
    
    // Fallback to 1 hour from now
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  static async getActiveSchedules(): Promise<unknown[]> {
    const now = new Date();
    
    return prisma.refreshSchedule.findMany({
      where: {
        isActive: true,
        OR: [
          {
            nextRunAt: {
              lte: now,
            },
          },
          {
            scheduleType: 'INTERVAL',
            lastRunAt: {
              lte: new Date(now.getTime() - 60 * 1000), // At least 1 minute ago
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}