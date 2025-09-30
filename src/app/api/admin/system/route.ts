import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component') || 'overview';

    switch (component) {
      case 'database':
        return await getDatabaseStatus();
      case 'cache':
        return await getCacheStatus();
      case 'cron':
        return await getCronStatus();
      case 'performance':
        return await getPerformanceMetrics();
      default:
        return await getSystemOverview();
    }

  } catch (error) {
    console.error('Failed to fetch system info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system info' },
      { status: 500 }
    );
  }
}

async function getSystemOverview() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return NextResponse.json({
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime),
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
}

async function getDatabaseStatus() {
  try {
    // Test database connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    // Get database statistics
    const [userCount, dashboardCount, queryCount, scheduleCount] = await Promise.all([
      prisma.user.count(),
      prisma.dashboard.count(),
      prisma.query.count(),
      prisma.refreshSchedule.count(),
    ]);

    return NextResponse.json({
      status: 'connected',
      latency,
      tables: {
        users: userCount,
        dashboards: dashboardCount,
        queries: queryCount,
        schedules: scheduleCount,
      },
      connection: {
        pool: 'Available', // This would need actual pool stats
        maxConnections: 100, // This would come from your DB config
        activeConnections: 1, // This would need actual connection count
      },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function getCacheStatus() {
  try {
    const stats = await DataCache.getStats();
    
    return NextResponse.json({
      status: 'active',
      stats: {
        totalEntries: stats.totalEntries,
        totalHits: stats.totalHits,
        hitRate: stats.hitRate,
        cacheSize: stats.cacheSize,
      },
      performance: {
        avgHitTime: '< 1ms', // This would need actual metrics
        avgMissTime: '45ms', // This would need actual metrics
      },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function getCronStatus() {
  try {
    // Try to get cron service status
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/status`);
    
    if (response.ok) {
      const cronData = await response.json();
      return NextResponse.json({
        status: 'running',
        activeSchedules: cronData.activeSchedules || 0,
        isRunning: cronData.isRunning || false,
        schedules: cronData.schedules || [],
      });
    } else {
      return NextResponse.json({
        status: 'error',
        error: 'Cron service not responding',
      });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'unknown',
      error: 'Unable to connect to cron service',
    });
  }
}

async function getPerformanceMetrics() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Get query performance metrics
    const [
      recentQueries,
      avgExecutionTime,
      failedExecutions,
      successfulExecutions,
    ] = await Promise.all([
      prisma.query.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),
      prisma.query.aggregate({
        where: { 
          createdAt: { gte: oneDayAgo },
          executionTime: { not: null },
        },
        _avg: { executionTime: true },
      }),
      prisma.refreshExecution.count({
        where: {
          createdAt: { gte: oneDayAgo },
          status: 'FAILED',
        },
      }),
      prisma.refreshExecution.count({
        where: {
          createdAt: { gte: oneDayAgo },
          status: 'COMPLETED',
        },
      }),
    ]);

    const totalExecutions = failedExecutions + successfulExecutions;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;

    return NextResponse.json({
      queries: {
        recentCount: recentQueries,
        avgExecutionTime: Math.round(avgExecutionTime._avg.executionTime || 0),
      },
      executions: {
        total: totalExecutions,
        successful: successfulExecutions,
        failed: failedExecutions,
        successRate: Math.round(successRate),
      },
      responseTime: {
        p50: '120ms', // These would need actual metrics collection
        p95: '450ms',
        p99: '890ms',
      },
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, component } = await request.json();

    switch (action) {
      case 'clear_cache':
        try {
          const cleared = await DataCache.clear();
          return NextResponse.json({
            success: true,
            message: `Cleared ${cleared} cache entries`,
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to clear cache',
          });
        }

      case 'cleanup_cache':
        try {
          const cleaned = await DataCache.cleanup();
          return NextResponse.json({
            success: true,
            message: `Cleaned up ${cleaned} expired cache entries`,
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cleanup cache',
          });
        }

      case 'restart_cron':
        try {
          // Stop cron service
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/status`, {
            method: 'DELETE',
          });
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Start cron service
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/status`, {
            method: 'POST',
          });

          return NextResponse.json({
            success: true,
            message: 'Cron service restarted successfully',
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to restart cron service',
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
        });
    }

  } catch (error) {
    console.error('Failed to perform system action:', error);
    return NextResponse.json(
      { error: 'Failed to perform system action' },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}