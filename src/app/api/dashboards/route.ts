import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        dashboards: {
          orderBy: { updatedAt: 'desc' }
        },
        organizations: {
          include: {
            organization: {
              include: {
                dashboards: {
                  orderBy: { updatedAt: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Combine personal and organization dashboards
    const personalDashboards = user.dashboards;
    const orgDashboards = user.organizations.flatMap(
      org => org.organization.dashboards
    );

    return NextResponse.json({
      dashboards: [...personalDashboards, ...orgDashboards]
    });
  } catch (error) {
    console.error('Failed to fetch dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, config, isPublic, organizationId } = body;

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Name and config are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If organizationId is provided, verify user has access
    if (organizationId) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId
        }
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Unauthorized to create dashboard in this organization' },
          { status: 403 }
        );
      }
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        config,
        isPublic: isPublic || false,
        userId: user.id,
        organizationId
      }
    });

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}