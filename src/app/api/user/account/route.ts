import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { signOut } from 'next-auth/react';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user data in the correct order due to foreign key constraints
    // Start a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // Delete API keys
      await tx.apiKey.deleteMany({
        where: { userId: user.id }
      });

      // Delete queries
      await tx.query.deleteMany({
        where: { userId: user.id }
      });

      // Delete dashboards
      await tx.dashboard.deleteMany({
        where: { userId: user.id }
      });

      // Delete usage records
      await tx.usage.deleteMany({
        where: { userId: user.id }
      });

      // Delete subscriptions
      await tx.subscription.deleteMany({
        where: { userId: user.id }
      });

      // Delete organization memberships
      await tx.organizationMember.deleteMany({
        where: { userId: user.id }
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id }
      });

      // Delete accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: user.id }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    // TODO: In a real app, you'd also want to:
    // 1. Cancel any active subscriptions with payment providers
    // 2. Send a confirmation email
    // 3. Log this action for audit purposes
    // 4. Clean up any external resources (e.g., uploaded files)

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}