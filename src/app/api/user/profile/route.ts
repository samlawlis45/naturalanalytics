import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            organization: true
          }
        },
        _count: {
          select: {
            queries: true,
            dashboards: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get additional stats
    const [favoriteQueries, dataSources, lastQuery] = await Promise.all([
      prisma.query.count({
        where: {
          userId: user.id,
          isFavorite: true
        }
      }),
      prisma.dataSource.count({
        where: {
          organization: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      }),
      prisma.query.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      organizations: user.organizations.map(org => ({
        id: org.organization.id,
        name: org.organization.name,
        role: org.role
      })),
      stats: {
        totalQueries: user._count.queries,
        totalDashboards: user._count.dashboards,
        totalDataSources: dataSources,
        favoriteQueries: favoriteQueries,
        lastActiveAt: lastQuery?.createdAt.toISOString() || null
      }
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    let imageUrl: string | undefined;

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      // In production, you'd upload to a cloud storage service
      // For demo, we'll store a data URL
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Convert to base64 data URL
      const base64 = buffer.toString('base64');
      const mimeType = imageFile.type || 'image/jpeg';
      imageUrl = `data:${mimeType};base64,${base64}`;
      
      // Alternatively, save to public directory (not recommended for production)
      // const fileName = `${uuidv4()}-${imageFile.name}`;
      // const path = join(process.cwd(), 'public', 'uploads', fileName);
      // await writeFile(path, buffer);
      // imageUrl = `/uploads/${fileName}`;
    }

    const updateData: any = {
      name: name || null,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      include: {
        organizations: {
          include: {
            organization: true
          }
        },
        _count: {
          select: {
            queries: true,
            dashboards: true,
          }
        }
      }
    });

    // Get additional stats
    const [favoriteQueries, dataSources] = await Promise.all([
      prisma.query.count({
        where: {
          userId: user.id,
          isFavorite: true
        }
      }),
      prisma.dataSource.count({
        where: {
          organization: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      })
    ]);

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      organizations: user.organizations.map(org => ({
        id: org.organization.id,
        name: org.organization.name,
        role: org.role
      })),
      stats: {
        totalQueries: user._count.queries,
        totalDashboards: user._count.dashboards,
        totalDataSources: dataSources,
        favoriteQueries: favoriteQueries,
        lastActiveAt: null
      }
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}