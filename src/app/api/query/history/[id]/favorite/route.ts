import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const queryId = params.id;

    // Find the query and verify ownership
    const query = await prisma.query.findFirst({
      where: {
        id: queryId,
        userId
      }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Toggle the favorite status
    const updatedQuery = await prisma.query.update({
      where: { id: queryId },
      data: { 
        isFavorite: !query.isFavorite 
      },
      select: {
        id: true,
        isFavorite: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      isFavorite: updatedQuery.isFavorite 
    });

  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}