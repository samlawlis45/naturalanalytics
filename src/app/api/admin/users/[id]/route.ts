import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        dashboards: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            isPublic: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        queries: {
          select: {
            id: true,
            naturalQuery: true,
            createdAt: true,
            executionTime: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            dashboards: true,
            queries: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        dashboardCount: user._count.dashboards,
        queryCount: user._count.queries,
        recentDashboards: user.dashboards.map(d => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
        recentQueries: user.queries.map(q => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
        })),
      },
    });

  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { action, ...updateData } = await request.json();

    // Prevent self-modification for critical actions
    if (params.id === currentUser.id && ['deactivate', 'demote', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Cannot perform this action on your own account' },
        { status: 400 }
      );
    }

    let updatedUser;

    switch (action) {
      case 'activate':
        updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: { isActive: true },
        });
        break;

      case 'deactivate':
        updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: { isActive: false },
        });
        break;

      case 'promote':
        updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: { role: 'ADMIN' },
        });
        break;

      case 'demote':
        updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: { role: 'USER' },
        });
        break;

      case 'update':
        updatedUser = await prisma.user.update({
          where: { id: params.id },
          data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.role && { role: updateData.role }),
            ...(typeof updateData.isActive === 'boolean' && { isActive: updateData.isActive }),
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLoginAt: updatedUser.lastLoginAt?.toISOString(),
      },
    });

  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Prevent self-deletion
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's refresh schedules
      await tx.refreshSchedule.deleteMany({
        where: { userId: params.id },
      });

      // Delete user's queries
      await tx.query.deleteMany({
        where: { userId: params.id },
      });

      // Delete user's dashboards
      await tx.dashboard.deleteMany({
        where: { userId: params.id },
      });

      // Delete user's data sources
      await tx.dataSource.deleteMany({
        where: { userId: params.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}