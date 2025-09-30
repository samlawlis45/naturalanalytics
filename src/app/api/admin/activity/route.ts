import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Since we don't have a dedicated activity log table, we'll synthesize from various sources
    const logs = [];

    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    recentUsers.forEach(user => {
      logs.push({
        id: `user-${user.id}`,
        userId: user.id,
        userName: user.name || user.email,
        action: 'registered',
        resource: 'account',
        timestamp: user.createdAt.toISOString(),
        details: `New user account created`,
        status: 'SUCCESS' as const,
      });
    });

    // Get recent dashboard creations
    const recentDashboards = await prisma.dashboard.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    recentDashboards.forEach(dashboard => {
      logs.push({
        id: `dashboard-${dashboard.id}`,
        userId: dashboard.user.id,
        userName: dashboard.user.name || dashboard.user.email,
        action: 'created',
        resource: 'dashboard',
        timestamp: dashboard.createdAt.toISOString(),
        details: `Created dashboard: ${dashboard.name}`,
        status: 'SUCCESS' as const,
      });
    });

    // Get recent query executions
    const recentQueries = await prisma.query.findMany({
      select: {
        id: true,
        naturalQuery: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    recentQueries.forEach(query => {
      logs.push({
        id: `query-${query.id}`,
        userId: query.user.id,
        userName: query.user.name || query.user.email,
        action: 'executed',
        resource: 'query',
        timestamp: query.createdAt.toISOString(),
        details: query.naturalQuery.substring(0, 100) + (query.naturalQuery.length > 100 ? '...' : ''),
        status: query.status === 'COMPLETED' ? 'SUCCESS' as const : 
               query.status === 'FAILED' ? 'ERROR' as const : 'WARNING' as const,
      });
    });

    // Get recent refresh executions
    const recentExecutions = await prisma.refreshExecution.findMany({
      select: {
        id: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        schedule: {
          select: {
            id: true,
            name: true,
            targetType: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    recentExecutions.forEach(execution => {
      if (execution.schedule?.user) {
        logs.push({
          id: `execution-${execution.id}`,
          userId: execution.schedule.user.id,
          userName: execution.schedule.user.name || execution.schedule.user.email,
          action: 'executed',
          resource: 'refresh schedule',
          timestamp: execution.createdAt.toISOString(),
          details: execution.errorMessage || `${execution.schedule.targetType} refresh ${execution.status.toLowerCase()}`,
          status: execution.status === 'COMPLETED' ? 'SUCCESS' as const :
                 execution.status === 'FAILED' ? 'ERROR' as const : 'WARNING' as const,
        });
      }
    });

    // Sort all logs by timestamp and apply pagination
    const sortedLogs = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    return NextResponse.json({
      logs: sortedLogs,
      total: logs.length,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}