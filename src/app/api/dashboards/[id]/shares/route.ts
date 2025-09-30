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

    const dashboardId = params.id;

    // Check if user owns the dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        user: { email: session.user.email },
      },
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Get all shares for this dashboard
    const shares = await prisma.dashboardShare.findMany({
      where: { dashboardId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = params.id;
    const { email, permission, expiresAt } = await request.json();

    // Validate input
    if (!email || !permission) {
      return NextResponse.json({ error: 'Email and permission are required' }, { status: 400 });
    }

    if (!['VIEW', 'COMMENT', 'EDIT'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 });
    }

    // Check if user owns the dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        user: { email: session.user.email },
      },
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if share already exists
    const existingShare = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId,
        email,
      },
    });

    if (existingShare) {
      return NextResponse.json({ error: 'Dashboard already shared with this email' }, { status: 400 });
    }

    // Find the user being shared with (if they exist)
    const sharedWithUser = await prisma.user.findUnique({
      where: { email },
    });

    // Create the share
    const share = await prisma.dashboardShare.create({
      data: {
        dashboardId,
        email,
        userId: sharedWithUser?.id,
        permission: permission as 'VIEW' | 'COMMENT' | 'EDIT',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: currentUser.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Create notification if user exists
    if (sharedWithUser) {
      await prisma.notification.create({
        data: {
          userId: sharedWithUser.id,
          type: 'DASHBOARD_SHARED',
          title: 'Dashboard Shared',
          message: `${currentUser.name || currentUser.email} shared a dashboard "${dashboard.name}" with you`,
          data: {
            dashboardId,
            dashboardName: dashboard.name,
            sharedBy: currentUser.name || currentUser.email,
            permission,
          },
        },
      });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}