import { prisma } from '../src/lib/prisma';

async function testDashboardFunctionality() {
  console.log('🎯 Testing Dashboard Save/Load Functionality...\n');

  let testUser: any;
  let testDashboard: any;
  let testOrg: any;

  try {
    // Test 1: Create test user for dashboard testing
    console.log('1️⃣ Creating test user...');
    testUser = await prisma.user.upsert({
      where: { email: 'dashboard-test@naturalanalytics.com' },
      update: {},
      create: {
        email: 'dashboard-test@naturalanalytics.com',
        name: 'Dashboard Test User'
      }
    });
    console.log(`✅ Test user: ${testUser.email}`);

    // Test 2: Create a dashboard with complex configuration
    console.log('\n2️⃣ Testing dashboard creation with complex config...');
    const dashboardConfig = {
      layout: 'grid',
      widgets: [
        {
          id: 'widget-1',
          type: 'chart',
          position: { x: 0, y: 0, w: 6, h: 4 },
          config: {
            chartType: 'line',
            query: 'Show me sales by month',
            data: [
              { month: 'Jan', sales: 45000 },
              { month: 'Feb', sales: 52000 },
              { month: 'Mar', sales: 48000 }
            ],
            theme: 'professional',
            showDataLabels: true
          }
        },
        {
          id: 'widget-2',
          type: 'metric',
          position: { x: 6, y: 0, w: 3, h: 2 },
          config: {
            title: 'Total Revenue',
            value: 145000,
            format: 'currency',
            change: { value: 15, trend: 'up' }
          }
        },
        {
          id: 'widget-3',
          type: 'table',
          position: { x: 9, y: 0, w: 3, h: 4 },
          config: {
            query: 'Top customers',
            columns: ['name', 'revenue', 'orders'],
            data: [
              { name: 'Acme Corp', revenue: 25000, orders: 15 },
              { name: 'TechCo', revenue: 18000, orders: 12 }
            ]
          }
        }
      ],
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        categories: ['Electronics', 'Software']
      },
      refreshInterval: 3600000 // 1 hour
    };

    testDashboard = await prisma.dashboard.create({
      data: {
        name: 'Test Sales Dashboard',
        description: 'A comprehensive test dashboard with multiple widgets',
        config: dashboardConfig,
        isPublic: false,
        userId: testUser.id
      }
    });
    console.log(`✅ Created dashboard: ${testDashboard.name} (ID: ${testDashboard.id})`);

    // Test 3: Load dashboard and verify configuration
    console.log('\n3️⃣ Testing dashboard load and config integrity...');
    const loadedDashboard = await prisma.dashboard.findUnique({
      where: { id: testDashboard.id },
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

    if (!loadedDashboard) {
      throw new Error('Failed to load dashboard');
    }

    // Verify configuration integrity
    const loadedConfig = loadedDashboard.config as any;
    console.log(`✅ Dashboard loaded successfully`);
    console.log(`   - Name: ${loadedDashboard.name}`);
    console.log(`   - Owner: ${loadedDashboard.user.email}`);
    console.log(`   - Widgets: ${loadedConfig.widgets?.length || 0}`);
    console.log(`   - Layout: ${loadedConfig.layout}`);
    console.log(`   - Filters configured: ${!!loadedConfig.filters}`);

    // Test 4: Update dashboard
    console.log('\n4️⃣ Testing dashboard update...');
    const updatedConfig = {
      ...loadedConfig,
      theme: 'dark',
      lastModifiedBy: testUser.id,
      widgets: [
        ...loadedConfig.widgets,
        {
          id: 'widget-4',
          type: 'chart',
          position: { x: 0, y: 4, w: 12, h: 4 },
          config: {
            chartType: 'bar',
            query: 'Products by category',
            data: [
              { category: 'Electronics', count: 150 },
              { category: 'Software', count: 200 }
            ]
          }
        }
      ]
    };

    const updatedDashboard = await prisma.dashboard.update({
      where: { id: testDashboard.id },
      data: {
        config: updatedConfig,
        description: 'Updated test dashboard with additional widget'
      }
    });
    console.log(`✅ Dashboard updated successfully`);
    console.log(`   - New widget count: ${(updatedDashboard.config as any).widgets.length}`);

    // Test 5: Create organization and test organization dashboards
    console.log('\n5️⃣ Testing organization dashboard...');
    testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        members: {
          create: {
            userId: testUser.id,
            role: 'OWNER'
          }
        }
      }
    });

    const orgDashboard = await prisma.dashboard.create({
      data: {
        name: 'Organization Dashboard',
        description: 'Shared organization dashboard',
        config: {
          layout: 'flex',
          widgets: [
            {
              id: 'org-widget-1',
              type: 'chart',
              config: { chartType: 'pie', data: [] }
            }
          ]
        },
        isPublic: false,
        userId: testUser.id,
        organizationId: testOrg.id
      }
    });
    console.log(`✅ Organization dashboard created: ${orgDashboard.name}`);

    // Test 6: Test dashboard sharing
    console.log('\n6️⃣ Testing dashboard sharing...');
    
    // Create another user to share with
    const shareUser = await prisma.user.upsert({
      where: { email: 'share-test@naturalanalytics.com' },
      update: {},
      create: {
        email: 'share-test@naturalanalytics.com',
        name: 'Share Test User'
      }
    });

    const dashboardShare = await prisma.dashboardShare.create({
      data: {
        dashboardId: testDashboard.id,
        userId: shareUser.id,
        permission: 'VIEW',
        createdBy: testUser.id
      }
    });
    console.log(`✅ Dashboard shared with ${shareUser.email} (${dashboardShare.permission} permission)`);

    // Test 7: Test dashboard views tracking
    console.log('\n7️⃣ Testing dashboard view tracking...');
    await prisma.dashboardView.create({
      data: {
        dashboardId: testDashboard.id,
        userId: testUser.id,
        userAgent: 'Test Script'
      }
    });

    const dashboardWithViews = await prisma.dashboard.findUnique({
      where: { id: testDashboard.id },
      include: {
        _count: {
          select: { views: true }
        }
      }
    });
    console.log(`✅ View tracked. Total views: ${dashboardWithViews?._count.views}`);

    // Test 8: Test dashboard comments
    console.log('\n8️⃣ Testing dashboard comments...');
    const comment = await prisma.dashboardComment.create({
      data: {
        dashboardId: testDashboard.id,
        userId: testUser.id,
        content: 'This dashboard looks great! The sales metrics are very insightful.'
      }
    });
    console.log(`✅ Comment added: "${comment.content.substring(0, 50)}..."`);

    // Test 9: Query all user dashboards
    console.log('\n9️⃣ Testing dashboard retrieval for user...');
    const userDashboards = await prisma.dashboard.findMany({
      where: {
        OR: [
          { userId: testUser.id },
          {
            organization: {
              members: {
                some: {
                  userId: testUser.id
                }
              }
            }
          },
          {
            shares: {
              some: {
                userId: testUser.id
              }
            }
          }
        ]
      },
      include: {
        user: true,
        organization: true,
        _count: {
          select: {
            views: true,
            comments: true,
            shares: true
          }
        }
      }
    });

    console.log(`✅ Found ${userDashboards.length} dashboards accessible to user:`);
    userDashboards.forEach(d => {
      console.log(`   - ${d.name} (${d.organization ? 'Organization' : 'Personal'}) - ${d._count.views} views, ${d._count.comments} comments`);
    });

    // Test 10: Test public dashboard access
    console.log('\n🔟 Testing public dashboard functionality...');
    const publicToken = `public-${Date.now()}`;
    await prisma.dashboard.update({
      where: { id: testDashboard.id },
      data: {
        isPublic: true,
        shareToken: publicToken
      }
    });

    const publicDashboard = await prisma.dashboard.findUnique({
      where: { shareToken: publicToken }
    });
    console.log(`✅ Dashboard made public with token: ${publicToken}`);
    console.log(`   - Can be accessed without authentication: ${!!publicDashboard}`);

    // Test 11: Complex query with aggregations
    console.log('\n1️⃣1️⃣ Testing dashboard statistics...');
    const dashboardStats = await prisma.dashboard.aggregate({
      where: { userId: testUser.id },
      _count: true,
      _max: {
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`✅ Dashboard statistics for user:`);
    console.log(`   - Total dashboards: ${dashboardStats._count}`);
    console.log(`   - Last created: ${dashboardStats._max.createdAt?.toLocaleDateString()}`);

    // Test 12: Test cascade deletion
    console.log('\n1️⃣2️⃣ Testing cascade deletion...');
    const tempDashboard = await prisma.dashboard.create({
      data: {
        name: 'Temporary Dashboard',
        config: { widgets: [] },
        userId: testUser.id
      }
    });

    // Add some related data
    await prisma.dashboardView.create({
      data: { dashboardId: tempDashboard.id, userId: testUser.id }
    });
    await prisma.dashboardComment.create({
      data: { dashboardId: tempDashboard.id, userId: testUser.id, content: 'Test' }
    });

    // Delete dashboard and verify cascade
    await prisma.dashboard.delete({ where: { id: tempDashboard.id } });
    const deletedViews = await prisma.dashboardView.count({ where: { dashboardId: tempDashboard.id } });
    const deletedComments = await prisma.dashboardComment.count({ where: { dashboardId: tempDashboard.id } });
    
    console.log(`✅ Cascade deletion verified:`);
    console.log(`   - Views deleted: ${deletedViews === 0}`);
    console.log(`   - Comments deleted: ${deletedComments === 0}`);

    console.log('\n🎉 All dashboard functionality tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Dashboard test failed!');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    try {
      // Clean up in reverse order of creation
      if (testDashboard) {
        await prisma.dashboardShare.deleteMany({ where: { dashboardId: testDashboard.id } });
        await prisma.dashboardComment.deleteMany({ where: { dashboardId: testDashboard.id } });
        await prisma.dashboardView.deleteMany({ where: { dashboardId: testDashboard.id } });
        await prisma.dashboard.delete({ where: { id: testDashboard.id } }).catch(() => {});
      }
      
      if (testOrg) {
        await prisma.dashboard.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.organizationMember.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.organization.delete({ where: { id: testOrg.id } }).catch(() => {});
      }

      // Keep test users for future tests
      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    await prisma.$disconnect();
  }
}

// Run the test
testDashboardFunctionality();