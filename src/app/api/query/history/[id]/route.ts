import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

    // Verify the query belongs to the user before deleting
    const query = await prisma.query.findFirst({
      where: {
        id: queryId,
        userId
      }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    await prisma.query.delete({
      where: { id: queryId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete query:', error);
    return NextResponse.json(
      { error: 'Failed to delete query' },
      { status: 500 }
    );
  }
}