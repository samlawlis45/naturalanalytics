import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Manual refresh execution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { targetType, targetId, scheduleId } = await request.json();

    if (!targetType || !targetId) {
      return NextResponse.json({ 
        error: 'Missing required fields: targetType, targetId' 
      }, { status: 400 });
    }

    // Verify user has access to the target
    if (targetType === 'DASHBOARD') {
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: targetId,
          userId: user.id,
        },
      });

      if (!dashboard) {
        return NextResponse.json({ error: 'Dashboard not found or access denied' }, { status: 404 });
      }
    } else if (targetType === 'QUERY') {
      const query = await prisma.query.findFirst({
        where: {
          id: targetId,
          userId: user.id,
        },
      });

      if (!query) {
        return NextResponse.json({ error: 'Query not found or access denied' }, { status: 404 });
      }
    }

    const startTime = Date.now();
    let execution;

    try {
      // Create execution record
      execution = await prisma.refreshExecution.create({
        data: {
          scheduleId: scheduleId || 'manual',
          status: 'RUNNING',
        },
      });

      // Execute the refresh based on target type
      let result;
      if (targetType === 'DASHBOARD') {
        result = await refreshDashboard(targetId, user.id);
      } else if (targetType === 'QUERY') {
        result = await refreshQuery(targetId, user.id);
      }

      const duration = Date.now() - startTime;

      // Update execution with success
      await prisma.refreshExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          recordsAffected: result?.recordsAffected || 0,
          metadata: result?.metadata || {},
        },
      });

      // Update schedule if provided
      if (scheduleId && scheduleId !== 'manual') {
        await prisma.refreshSchedule.update({
          where: { id: scheduleId },
          data: {
            lastRunAt: new Date(),
            runCount: { increment: 1 },
            lastError: null,
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        execution: execution.id,
        duration,
        recordsAffected: result?.recordsAffected || 0
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update execution with failure
      if (execution) {
        await prisma.refreshExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            duration,
            errorMessage,
          },
        });
      }

      // Update schedule error count if provided
      if (scheduleId && scheduleId !== 'manual') {
        await prisma.refreshSchedule.update({
          where: { id: scheduleId },
          data: {
            lastRunAt: new Date(),
            errorCount: { increment: 1 },
            lastError: errorMessage,
          },
        });
      }

      return NextResponse.json({ 
        error: 'Refresh failed', 
        message: errorMessage 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error executing refresh:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to refresh a dashboard
async function refreshDashboard(dashboardId: string, userId: string) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
  });

  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  // For now, just update the dashboard's updatedAt timestamp
  // In a real implementation, you would re-execute all queries in the dashboard
  await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { updatedAt: new Date() },
  });

  return {
    recordsAffected: 1,
    metadata: {
      type: 'dashboard',
      dashboardId,
      refreshedAt: new Date().toISOString(),
    },
  };
}

// Helper function to refresh a query
async function refreshQuery(queryId: string, userId: string) {
  const query = await prisma.query.findFirst({
    where: { id: queryId, userId },
    include: { dataSource: true },
  });

  if (!query) {
    throw new Error('Query not found');
  }

  // For now, just update the query's updatedAt timestamp
  // In a real implementation, you would re-execute the query against the data source
  await prisma.query.update({
    where: { id: queryId },
    data: { 
      updatedAt: new Date(),
      status: 'COMPLETED',
    },
  });

  return {
    recordsAffected: 1,
    metadata: {
      type: 'query',
      queryId,
      sqlQuery: query.sqlQuery,
      refreshedAt: new Date().toISOString(),
    },
  };
}