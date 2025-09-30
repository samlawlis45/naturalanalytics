import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { DataSourceType } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            organization: {
              include: {
                dataSources: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dataSources = user.organizations.flatMap(
      org => org.organization.dataSources
    );

    return NextResponse.json({ dataSources });
  } catch (error) {
    console.error('Failed to fetch data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
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
    const { name, type, connectionString, organizationId } = body;

    if (!name || !type || !connectionString || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          where: { organizationId }
        }
      }
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized to add data source to this organization' },
        { status: 403 }
      );
    }

    const dataSource = await prisma.dataSource.create({
      data: {
        name,
        type: type as DataSourceType,
        connectionString,
        organizationId,
        isActive: true
      }
    });

    return NextResponse.json({ dataSource });
  } catch (error) {
    console.error('Failed to create data source:', error);
    return NextResponse.json(
      { error: 'Failed to create data source' },
      { status: 500 }
    );
  }
}