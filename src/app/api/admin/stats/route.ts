import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    // Calculate date ranges
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch user statistics
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisMonth,
      totalDashboards,
      totalQueries,
      totalDataSources,
      totalSchedules,
      recentLogins,
      recentQueries,
      recentExecutions,
      failedExecutions,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ 
        where: { 
          createdAt: { gte: thisMonthStart } 
        } 
      }),

      // Content counts
      prisma.dashboard.count(),
      prisma.query.count(),
      prisma.dataSource.count(),
      prisma.refreshSchedule.count(),

      // Activity counts (24h)
      prisma.user.count({
        where: {
          lastLoginAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.query.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.refreshExecution.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          status: 'COMPLETED',
        },
      }),
      prisma.refreshExecution.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          status: 'FAILED',
        },
      }),
    ]);

    // Get system information
    const systemStats = {
      uptime: formatUptime(process.uptime()),
      cacheSize: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      dbConnections: 1, // This would need to be fetched from your DB pool
      memoryUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
    };

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        newThisMonth: newUsersThisMonth,
      },
      content: {
        dashboards: totalDashboards,
        queries: totalQueries,
        dataSources: totalDataSources,
        schedules: totalSchedules,
      },
      activity: {
        logins24h: recentLogins,
        queries24h: recentQueries,
        refreshes24h: recentExecutions,
        errors24h: failedExecutions,
      },
      system: systemStats,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
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