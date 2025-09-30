import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Find dashboard by share token
    const dashboard = await prisma.dashboard.findUnique({
      where: {
        shareToken: token,
        isPublic: true,
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

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Record the view
    await prisma.dashboardView.create({
      data: {
        dashboardId: dashboard.id,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Error fetching shared dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}