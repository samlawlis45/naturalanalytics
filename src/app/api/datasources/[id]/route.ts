import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { DataSourceType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                user: { email: session.user.email }
              }
            }
          }
        }
      }
    });

    if (!dataSource || dataSource.organization.members.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ dataSource });
  } catch (error) {
    console.error('Failed to fetch data source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data source' },
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
    const { name, type, connectionString, isActive } = body;

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          }
        }
      }
    });

    if (!dataSource || dataSource.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedDataSource = await prisma.dataSource.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type: type as DataSourceType }),
        ...(connectionString && { connectionString }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    return NextResponse.json({ dataSource: updatedDataSource });
  } catch (error) {
    console.error('Failed to update data source:', error);
    return NextResponse.json(
      { error: 'Failed to update data source' },
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

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                user: { email: session.user.email },
                role: 'OWNER'
              }
            }
          }
        }
      }
    });

    if (!dataSource || dataSource.organization.members.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.dataSource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete data source:', error);
    return NextResponse.json(
      { error: 'Failed to delete data source' },
      { status: 500 }
    );
  }
}