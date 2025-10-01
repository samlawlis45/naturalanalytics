import { prisma } from '../src/lib/prisma';

async function testAppDatabaseIntegration() {
  console.log('🔍 Testing Application Database Integration...\n');

  try {
    // Test 1: Query History
    console.log('1️⃣ Testing Query History...');
    const queries = await prisma.query.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        dataSource: true
      }
    });
    console.log(`   Found ${queries.length} queries in history`);
    queries.forEach(q => {
      console.log(`   - "${q.naturalQuery}" by ${q.user.email} (${q.executionTime}ms)`);
    });

    // Test 2: Dashboards
    console.log('\n2️⃣ Testing Dashboards...');
    const dashboards = await prisma.dashboard.findMany({
      include: {
        user: true,
        _count: {
          select: {
            views: true,
            comments: true,
            shares: true
          }
        }
      }
    });
    console.log(`   Found ${dashboards.length} dashboards`);
    dashboards.forEach(d => {
      console.log(`   - "${d.name}" by ${d.user.email} (${d._count.views} views, ${d._count.comments} comments)`);
    });

    // Test 3: Data Sources
    console.log('\n3️⃣ Testing Data Sources...');
    const dataSources = await prisma.dataSource.findMany({
      include: {
        _count: {
          select: {
            queries: true
          }
        }
      }
    });
    console.log(`   Found ${dataSources.length} data sources`);
    dataSources.forEach(ds => {
      console.log(`   - ${ds.name} (${ds.type}) - ${ds.isActive ? 'Active' : 'Inactive'} - ${ds._count.queries} queries`);
    });

    // Test 4: Users and Sessions
    console.log('\n4️⃣ Testing Users and Sessions...');
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            queries: true,
            dashboards: true,
            sessions: true,
            apiKeys: true
          }
        }
      }
    });
    console.log(`   Found ${users.length} users`);
    users.forEach(u => {
      console.log(`   - ${u.email}: ${u._count.queries} queries, ${u._count.dashboards} dashboards, ${u._count.sessions} sessions`);
    });

    // Test 5: Refresh Schedules
    console.log('\n5️⃣ Testing Refresh Schedules...');
    const schedules = await prisma.refreshSchedule.findMany({
      include: {
        user: true,
        _count: {
          select: {
            executions: true
          }
        }
      }
    });
    console.log(`   Found ${schedules.length} refresh schedules`);
    schedules.forEach(s => {
      console.log(`   - ${s.name} (${s.scheduleType}) - ${s.isActive ? 'Active' : 'Inactive'} - ${s._count.executions} executions`);
    });

    // Test 6: API Keys
    console.log('\n6️⃣ Testing API Keys...');
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: true
      }
    });
    console.log(`   Found ${apiKeys.length} API keys`);
    apiKeys.forEach(k => {
      console.log(`   - ${k.name} for ${k.user.email} (Last used: ${k.lastUsedAt || 'Never'})`);
    });

    // Test 7: Dashboard Sharing
    console.log('\n7️⃣ Testing Dashboard Sharing...');
    const shares = await prisma.dashboardShare.findMany({
      include: {
        dashboard: true,
        user: true,
        creator: true
      }
    });
    console.log(`   Found ${shares.length} dashboard shares`);
    shares.forEach(s => {
      console.log(`   - "${s.dashboard.name}" shared with ${s.user?.email || s.email} (${s.permission})`);
    });

    // Test 8: Database Statistics
    console.log('\n8️⃣ Database Statistics...');
    const stats = {
      totalQueries: await prisma.query.count(),
      completedQueries: await prisma.query.count({ where: { status: 'COMPLETED' } }),
      favoriteQueries: await prisma.query.count({ where: { isFavorite: true } }),
      publicDashboards: await prisma.dashboard.count({ where: { isPublic: true } }),
      activeDataSources: await prisma.dataSource.count({ where: { isActive: true } }),
      totalNotifications: await prisma.notification.count(),
      unreadNotifications: await prisma.notification.count({ where: { isRead: false } })
    };

    console.log(`   Total Queries: ${stats.totalQueries} (${stats.completedQueries} completed, ${stats.favoriteQueries} favorites)`);
    console.log(`   Public Dashboards: ${stats.publicDashboards}`);
    console.log(`   Active Data Sources: ${stats.activeDataSources}`);
    console.log(`   Notifications: ${stats.totalNotifications} (${stats.unreadNotifications} unread)`);

    // Test 9: Recent Activity
    console.log('\n9️⃣ Recent Activity...');
    const recentActivity = await prisma.query.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        naturalQuery: true,
        createdAt: true,
        user: {
          select: { email: true }
        }
      }
    });
    console.log('   Recent queries:');
    recentActivity.forEach(a => {
      console.log(`   - ${a.createdAt.toLocaleString()}: "${a.naturalQuery}" by ${a.user.email}`);
    });

    console.log('\n✅ All database integration tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Database integration test failed!');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAppDatabaseIntegration();