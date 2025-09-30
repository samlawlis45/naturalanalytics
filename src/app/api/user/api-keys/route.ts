import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
  return `na_${randomBytes(32).toString('hex')}`;
}

export async function GET(request: NextRequest) {
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

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        createdAt: key.createdAt.toISOString(),
      }))
    });

  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
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

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has reached API key limit
    const existingKeysCount = await prisma.apiKey.count({
      where: { userId: user.id }
    });

    if (existingKeysCount >= 10) {
      return NextResponse.json(
        { error: 'API key limit reached. Please delete unused keys.' },
        { status: 400 }
      );
    }

    // Generate new API key
    const apiKey = generateApiKey();

    const newApiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: apiKey,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      id: newApiKey.id,
      name: newApiKey.name,
      key: newApiKey.key,
      createdAt: newApiKey.createdAt.toISOString(),
    });

  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}