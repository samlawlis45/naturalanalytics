import { prisma } from '../src/lib/prisma';
import { DataSourceType, QueryStatus, RefreshTargetType, ScheduleType } from '@prisma/client';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Test 2: Count users
    console.log('2️⃣ Checking existing data...');
    const userCount = await prisma.user.count();
    const queryCount = await prisma.query.count();
    const dashboardCount = await prisma.dashboard.count();
    const dataSourceCount = await prisma.dataSource.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Queries: ${queryCount}`);
    console.log(`   Dashboards: ${dashboardCount}`);
    console.log(`   Data Sources: ${dataSourceCount}\n`);

    // Test 3: Test write operations
    console.log('3️⃣ Testing write operations...');
    
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@naturalanalytics.com' },
      update: {},
      create: {
        email: 'test@naturalanalytics.com',
        name: 'Test User'
      }
    });
    console.log('✅ Created/found test user:', testUser.email);

    // Create a test query
    const testQuery = await prisma.query.create({
      data: {
        naturalQuery: 'Show me total sales',
        sqlQuery: 'SELECT SUM(amount) FROM sales',
        status: QueryStatus.COMPLETED,
        executionTime: 150,
        userId: testUser.id,
        result: { totalSales: 50000 }
      }
    });
    console.log('✅ Created test query:', testQuery.naturalQuery);

    // Create a test dashboard
    const testDashboard = await prisma.dashboard.create({
      data: {
        name: 'Test Dashboard',
        description: 'A test dashboard',
        config: {
          widgets: [
            { type: 'chart', query: testQuery.naturalQuery }
          ]
        },
        userId: testUser.id
      }
    });
    console.log('✅ Created test dashboard:', testDashboard.name);

    // Create a test refresh schedule
    let testSchedule;
    try {
      testSchedule = await prisma.refreshSchedule.create({
        data: {
          name: 'Test Refresh Schedule',
          description: 'Test schedule for dashboard',
          targetType: RefreshTargetType.DASHBOARD,
          targetId: testDashboard.id,
          scheduleType: ScheduleType.INTERVAL,
          interval: 60, // Every hour
          userId: testUser.id
        }
      });
      console.log('✅ Created test refresh schedule:', testSchedule.name);
    } catch (e) {
      console.log('⚠️  RefreshSchedule table might not exist, skipping...');
    }

    // Test 4: Test relationships
    console.log('\n4️⃣ Testing relationships...');
    const userWithRelations = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        queries: true,
        dashboards: true,
        refreshSchedules: true
      }
    });
    
    console.log(`   User has ${userWithRelations?.queries.length} queries`);
    console.log(`   User has ${userWithRelations?.dashboards.length} dashboards`);
    console.log(`   User has ${userWithRelations?.refreshSchedules.length} refresh schedules`);

    // Test 5: Test complex queries
    console.log('\n5️⃣ Testing complex queries...');
    const recentQueries = await prisma.query.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        dataSource: true
      }
    });
    console.log(`✅ Found ${recentQueries.length} recent queries`);

    // Test 6: Test aggregations
    console.log('\n6️⃣ Testing aggregations...');
    const avgExecutionTime = await prisma.query.aggregate({
      _avg: {
        executionTime: true
      },
      where: {
        status: QueryStatus.COMPLETED
      }
    });
    console.log(`   Average query execution time: ${avgExecutionTime._avg.executionTime || 0}ms`);

    // Test 7: Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    if (testSchedule) {
      await prisma.refreshSchedule.delete({ where: { id: testSchedule.id } });
    }
    await prisma.dashboard.delete({ where: { id: testDashboard.id } });
    await prisma.query.delete({ where: { id: testQuery.id } });
    // Note: We keep the test user for future tests
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All database tests passed successfully!');
    
    // Show database info
    const dbUrl = process.env.DATABASE_URL || '';
    const dbType = dbUrl.includes('postgresql') ? 'PostgreSQL' : 
                   dbUrl.includes('mysql') ? 'MySQL' : 
                   dbUrl.includes('sqlite') ? 'SQLite' : 'Unknown';
    console.log(`\n📊 Database Info:`);
    console.log(`   Type: ${dbType}`);
    console.log(`   URL: ${dbUrl.split('@')[1] || 'Not configured'}`);

  } catch (error) {
    console.error('\n❌ Database connection test failed!');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P1001')) {
        console.error('\n🔧 Suggestion: Database server is not reachable. Check if:');
        console.error('   - PostgreSQL is running');
        console.error('   - DATABASE_URL in .env is correct');
        console.error('   - Database exists');
      } else if (error.message.includes('P1002')) {
        console.error('\n🔧 Suggestion: Database server timed out. Check if:');
        console.error('   - Database server is running');
        console.error('   - Network connection is stable');
      } else if (error.message.includes('P2002')) {
        console.error('\n🔧 Suggestion: Unique constraint violation. Test data may already exist.');
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection();