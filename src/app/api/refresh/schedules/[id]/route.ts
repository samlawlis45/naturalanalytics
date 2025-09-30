import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const schedule = await prisma.refreshSchedule.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching refresh schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      scheduleType,
      interval,
      cronExpression,
      timezone,
      isActive
    } = await request.json();

    // Calculate next run time if schedule type or interval changed
    let nextRunAt: Date | null = null;
    if (scheduleType === 'INTERVAL' && interval) {
      nextRunAt = new Date(Date.now() + interval * 60 * 1000);
    }

    const schedule = await prisma.refreshSchedule.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(scheduleType && { scheduleType: scheduleType as any }),
        ...(interval !== undefined && { interval }),
        ...(cronExpression !== undefined && { cronExpression }),
        ...(timezone && { timezone }),
        ...(isActive !== undefined && { isActive }),
        ...(nextRunAt && { nextRunAt }),
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error updating refresh schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.refreshSchedule.delete({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting refresh schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}