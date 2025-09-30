import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        queries: {
          select: {
            id: true,
            naturalQuery: true,
            sqlQuery: true,
            result: true,
            status: true,
            executionTime: true,
            isFavorite: true,
            createdAt: true,
            dataSource: {
              select: {
                name: true,
                type: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        dashboards: {
          select: {
            id: true,
            name: true,
            description: true,
            config: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
      queries: user.queries.map(query => ({
        ...query,
        createdAt: query.createdAt.toISOString(),
      })),
      dashboards: user.dashboards.map(dashboard => ({
        ...dashboard,
        createdAt: dashboard.createdAt.toISOString(),
        updatedAt: dashboard.updatedAt.toISOString(),
      })),
      organizations: user.organizations.map(org => ({
        name: org.organization.name,
        slug: org.organization.slug,
        role: org.role,
      })),
      statistics: {
        totalQueries: user.queries.length,
        totalDashboards: user.dashboards.length,
        favoriteQueries: user.queries.filter(q => q.isFavorite).length,
      }
    };

    // Convert to JSON and create download
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="natural-analytics-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error) {
    console.error('Failed to export data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}