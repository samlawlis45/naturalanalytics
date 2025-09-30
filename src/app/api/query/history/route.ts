import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const favorites = searchParams.get('favorites') === 'true';

    const whereClause = {
      userId,
      ...(favorites && { isFavorite: true })
    };

    const [queries, totalCount] = await Promise.all([
      prisma.query.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          naturalQuery: true,
          sqlQuery: true,
          executionTime: true,
          createdAt: true,
          isFavorite: true,
          dataSourceId: true,
          result: true
        }
      }),
      prisma.query.count({ where: whereClause })
    ]);

    return NextResponse.json({
      queries: queries.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString()
      })),
      totalCount,
      success: true
    });

  } catch (error) {
    console.error('Failed to fetch query history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;

    // Clear all query history for the user
    await prisma.query.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to clear query history:', error);
    return NextResponse.json(
      { error: 'Failed to clear query history' },
      { status: 500 }
    );
  }
}