import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: {
        user: true,
        organization: true
      }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Check access permissions
    if (!dashboard.isPublic) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user owns the dashboard or belongs to the organization
      const hasAccess = dashboard.userId === user.id || 
        (dashboard.organizationId && await prisma.organizationMember.findFirst({
          where: {
            userId: user.id,
            organizationId: dashboard.organizationId
          }
        }));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, config, isPublic } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Check if user owns the dashboard or has admin access to the organization
    const hasAccess = dashboard.userId === user.id || 
      (dashboard.organizationId && await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId: dashboard.organizationId,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedDashboard = await prisma.dashboard.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(config && { config }),
        ...(typeof isPublic === 'boolean' && { isPublic })
      }
    });

    return NextResponse.json({ dashboard: updatedDashboard });
  } catch (error) {
    console.error('Failed to update dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Check if user owns the dashboard or has owner access to the organization
    const hasAccess = dashboard.userId === user.id || 
      (dashboard.organizationId && await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId: dashboard.organizationId,
          role: 'OWNER'
        }
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.dashboard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}