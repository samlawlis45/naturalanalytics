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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const schedules = await prisma.refreshSchedule.findMany({
      where: { userId: user.id },
      include: {
        executions: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add target names for display
    const schedulesWithTargets = await Promise.all(
      schedules.map(async (schedule) => {
        let targetName = 'Unknown';
        
        if (schedule.targetType === 'DASHBOARD') {
          const dashboard = await prisma.dashboard.findUnique({
            where: { id: schedule.targetId },
            select: { name: true },
          });
          targetName = dashboard?.name || 'Deleted Dashboard';
        } else if (schedule.targetType === 'QUERY') {
          const query = await prisma.query.findUnique({
            where: { id: schedule.targetId },
            select: { naturalQuery: true },
          });
          targetName = query?.naturalQuery || 'Deleted Query';
        }

        return {
          ...schedule,
          targetName,
        };
      })
    );

    return NextResponse.json({ schedules: schedulesWithTargets });
  } catch (error) {
    console.error('Error fetching refresh schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const {
      name,
      description,
      targetType,
      targetId,
      scheduleType,
      interval,
      cronExpression,
      timezone = 'UTC'
    } = await request.json();

    // Validate required fields
    if (!name || !targetType || !targetId || !scheduleType) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, targetType, targetId, scheduleType' 
      }, { status: 400 });
    }

    // Validate schedule type specific fields
    if (scheduleType === 'INTERVAL' && (!interval || interval < 1)) {
      return NextResponse.json({ 
        error: 'Interval must be at least 1 minute' 
      }, { status: 400 });
    }

    if (scheduleType === 'CRON' && !cronExpression) {
      return NextResponse.json({ 
        error: 'Cron expression is required for CRON schedule type' 
      }, { status: 400 });
    }

    // Verify target exists and user has access
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

    // Calculate next run time
    let nextRunAt: Date | null = null;
    if (scheduleType === 'INTERVAL') {
      nextRunAt = new Date(Date.now() + interval * 60 * 1000);
    }
    // TODO: Add cron parsing for CRON type

    const schedule = await prisma.refreshSchedule.create({
      data: {
        name,
        description,
        targetType: targetType as 'DASHBOARD' | 'QUERY',
        targetId,
        scheduleType: scheduleType as 'MANUAL' | 'INTERVAL' | 'CRON' | 'REALTIME',
        interval,
        cronExpression,
        timezone,
        nextRunAt,
        userId: user.id,
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error creating refresh schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}