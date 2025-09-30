import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email; // Using email as userId for now

    // Get current date ranges
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalQueries,
      totalDashboards,
      totalDataSources,
      recentQueries,
      queriesThisWeek,
      queriesLastWeek,
      dashboardsThisMonth,
      topDataSources,
      queryTrends
    ] = await Promise.all([
      // Total queries count
      prisma.query.count({
        where: { userId }
      }),

      // Total dashboards count
      prisma.dashboard.count({
        where: { userId }
      }),

      // Total data sources count
      prisma.dataSource.count({
        where: { organizationId: 'demo-org' } // Replace with actual org filtering
      }),

      // Recent queries (last 10)
      prisma.query.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          naturalQuery: true,
          executionTime: true,
          createdAt: true,
          sqlQuery: true
        }
      }),

      // Queries this week
      prisma.query.count({
        where: {
          userId,
          createdAt: { gte: lastWeek }
        }
      }),

      // Queries last week (for comparison)
      prisma.query.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: lastWeek
          }
        }
      }),

      // Dashboards created this month
      prisma.dashboard.count({
        where: {
          userId,
          createdAt: { gte: lastMonth }
        }
      }),

      // Top data sources by usage
      prisma.query.groupBy({
        by: ['dataSourceId'],
        where: {
          userId,
          dataSourceId: { not: null }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }),

      // Query trends over last 7 days
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM "queries" 
        WHERE user_id = ${userId}
          AND created_at >= ${lastWeek}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
    ]);

    // Calculate week-over-week growth
    const weekOverWeekGrowth = queriesLastWeek > 0 
      ? ((queriesThisWeek - queriesLastWeek) / queriesLastWeek * 100)
      : queriesThisWeek > 0 ? 100 : 0;

    // Calculate average execution time
    const avgExecutionTime = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length
      : 0;

    // Format query trends for charts (fill missing dates)
    const trendMap = new Map(queryTrends.map(t => [t.date, Number(t.count)]));
    const formattedTrends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      formattedTrends.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: trendMap.get(dateStr) || 0
      });
    }

    // Get data source names for top usage
    const dataSourceIds = topDataSources
      .filter(ds => ds.dataSourceId)
      .map(ds => ds.dataSourceId!);
    
    const dataSourceDetails = dataSourceIds.length > 0 
      ? await prisma.dataSource.findMany({
          where: { id: { in: dataSourceIds } },
          select: { id: true, name: true, type: true }
        })
      : [];

    const topDataSourcesWithNames = topDataSources.map(usage => {
      const details = dataSourceDetails.find(ds => ds.id === usage.dataSourceId);
      return {
        name: details?.name || 'Demo Database',
        type: details?.type || 'DEMO',
        count: usage._count.id
      };
    });

    const stats = {
      overview: {
        totalQueries,
        totalDashboards,
        totalDataSources,
        weekOverWeekGrowth: Math.round(weekOverWeekGrowth * 10) / 10, // Round to 1 decimal
        avgExecutionTime: Math.round(avgExecutionTime)
      },
      activity: {
        queriesThisWeek,
        queriesLastWeek,
        dashboardsThisMonth,
        recentQueries: recentQueries.map(q => ({
          id: q.id,
          naturalQuery: q.naturalQuery,
          executionTime: q.executionTime,
          createdAt: q.createdAt.toISOString(),
          sqlQuery: q.sqlQuery?.substring(0, 100) + (q.sqlQuery?.length > 100 ? '...' : '')
        }))
      },
      trends: {
        daily: formattedTrends,
        topDataSources: topDataSourcesWithNames
      },
      performance: {
        avgExecutionTime,
        fastestQuery: Math.min(...recentQueries.map(q => q.executionTime), 0),
        slowestQuery: Math.max(...recentQueries.map(q => q.executionTime), 0),
        totalExecutionTime: recentQueries.reduce((sum, q) => sum + q.executionTime, 0)
      }
    };

    return NextResponse.json({ stats, success: true });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

// Optional: Add a POST endpoint for real-time stats updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'query_executed':
        // This could be called after each query to update real-time stats
        // For now, we'll just return success since query creation already updates the DB
        return NextResponse.json({ success: true });
      
      case 'dashboard_created':
        // Could track dashboard creation events
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Failed to update stats:', error);
    return NextResponse.json(
      { error: 'Failed to update statistics' },
      { status: 500 }
    );
  }
}