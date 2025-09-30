import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// In a real app, you'd store these preferences in the database
// For now, we'll use in-memory storage with defaults
const userSettingsCache = new Map<string, any>();

const getDefaultSettings = () => ({
  notifications: {
    email: {
      queryCompleted: true,
      dashboardShared: true,
      weeklyDigest: false,
    },
    push: {
      queryCompleted: false,
      dashboardShared: false,
    },
  },
  appearance: {
    theme: 'system',
    compactMode: false,
    showLineNumbers: true,
  },
  privacy: {
    allowAnalytics: true,
    shareUsageData: false,
    publicProfile: false,
  },
  apiKeys: [],
});

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

    // Get API keys
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

    // Get cached settings or defaults
    let settings = userSettingsCache.get(user.id) || getDefaultSettings();
    
    // Add API keys to settings
    settings.apiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: key.key,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
      createdAt: key.createdAt.toISOString(),
    }));

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const settings = await request.json();
    
    // Remove API keys from settings before caching (they're managed separately)
    const { apiKeys, ...settingsToCache } = settings;
    
    // Cache the settings
    userSettingsCache.set(user.id, settingsToCache);
    
    // In a real app, you'd save these to the database
    // await prisma.userSettings.upsert({
    //   where: { userId: user.id },
    //   create: {
    //     userId: user.id,
    //     settings: settingsToCache
    //   },
    //   update: {
    //     settings: settingsToCache
    //   }
    // });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}