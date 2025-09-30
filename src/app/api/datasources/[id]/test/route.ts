import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { ConnectionManager } from '@/lib/db/connection-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: {
                user: { email: session.user.email }
              }
            }
          }
        }
      }
    });

    if (!dataSource || dataSource.organization.members.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Test the connection
    try {
      const connection = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type,
        dataSource.connectionString
      );

      const isConnected = await connection.testConnection();
      
      if (!isConnected) {
        return NextResponse.json({ 
          connected: false, 
          error: 'Failed to connect to database' 
        });
      }

      // Get some basic info about the database
      let tableCount = 0;
      try {
        let query: string;
        switch (dataSource.type) {
          case 'POSTGRESQL':
            query = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'";
            break;
          case 'MYSQL':
            query = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()";
            break;
          case 'BIGQUERY':
            query = "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES";
            break;
          default:
            query = "SELECT 1 as count";
        }

        const result = await connection.query(query);
        tableCount = Number(result[0]?.count) || 0;
      } catch (error) {
        console.error('Failed to get table count:', error);
      }

      return NextResponse.json({ 
        connected: true,
        message: 'Connection successful',
        details: {
          type: dataSource.type,
          tableCount
        }
      });

    } catch (error) {
      console.error('Connection test error:', error);
      return NextResponse.json({ 
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }

  } catch (error) {
    console.error('Failed to test connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}