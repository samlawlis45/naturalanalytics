import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

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

    const publicLink = dashboard.shareToken 
      ? `${process.env.NEXTAUTH_URL}/shared/${dashboard.shareToken}`
      : null;

    return NextResponse.json({
      isPublic: dashboard.isPublic,
      publicLink,
      allowComments: dashboard.allowComments,
      allowExport: dashboard.allowExport,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
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

    const dashboardId = params.id;
    const { isPublic, allowComments, allowExport } = await request.json();

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

    // Generate share token if making public and doesn't have one
    let shareToken = dashboard.shareToken;
    if (isPublic && !shareToken) {
      shareToken = nanoid(32);
    }

    // Update dashboard
    const updatedDashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: {
        isPublic,
        shareToken: isPublic ? shareToken : null,
        allowComments: allowComments ?? dashboard.allowComments,
        allowExport: allowExport ?? dashboard.allowExport,
      },
    });

    const publicLink = updatedDashboard.shareToken 
      ? `${process.env.NEXTAUTH_URL}/shared/${updatedDashboard.shareToken}`
      : null;

    return NextResponse.json({
      isPublic: updatedDashboard.isPublic,
      publicLink,
      allowComments: updatedDashboard.allowComments,
      allowExport: updatedDashboard.allowExport,
    });
  } catch (error) {
    console.error('Error updating public settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}