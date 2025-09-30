import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  })

  // Create sample users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@naturalanalytics.ai' },
      update: {},
      create: {
        email: 'demo@naturalanalytics.ai',
        name: 'Demo User',
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@naturalanalytics.ai' },
      update: {},
      create: {
        email: 'admin@naturalanalytics.ai',
        name: 'Admin User',
        image: 'https://avatars.githubusercontent.com/u/2?v=4',
      },
    }),
  ])

  // Create organization memberships
  await Promise.all([
    prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: users[0].id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: users[0].id,
        organizationId: organization.id,
        role: 'OWNER',
      },
    }),
    prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: users[1].id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: users[1].id,
        organizationId: organization.id,
        role: 'ADMIN',
      },
    }),
  ])

  // Create sample data source
  const dataSource = await prisma.dataSource.upsert({
    where: { id: 'demo-datasource' },
    update: {},
    create: {
      id: 'demo-datasource',
      name: 'E-commerce Database',
      type: 'POSTGRESQL',
      connectionString: 'postgresql://demo:demo@localhost:5432/demo',
      organizationId: organization.id,
      isActive: true,
    },
  })

  // Create sample queries
  const sampleQueries = [
    {
      naturalQuery: 'Show me total sales by month',
      sqlQuery: 'SELECT DATE_TRUNC(\'month\', order_date) as month, SUM(total_amount) as total_sales FROM orders GROUP BY month ORDER BY month',
      status: 'COMPLETED' as const,
      executionTime: 150,
      userId: users[0].id,
      dataSourceId: dataSource.id,
    },
    {
      naturalQuery: 'How many customers do we have?',
      sqlQuery: 'SELECT COUNT(*) as customer_count FROM customers',
      status: 'COMPLETED' as const,
      executionTime: 89,
      userId: users[0].id,
      dataSourceId: dataSource.id,
    },
    {
      naturalQuery: 'What are our top selling products?',
      sqlQuery: 'SELECT p.name, SUM(o.quantity) as total_sold FROM products p JOIN orders o ON p.id = o.product_id GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 10',
      status: 'COMPLETED' as const,
      executionTime: 234,
      userId: users[0].id,
      dataSourceId: dataSource.id,
    },
  ]

  for (const query of sampleQueries) {
    await prisma.query.create({
      data: query,
    })
  }

  // Create sample dashboards
  const dashboard = await prisma.dashboard.create({
    data: {
      name: 'Sales Overview',
      description: 'Key sales metrics and trends',
      config: {
        widgets: [
          {
            id: 'total-sales',
            type: 'metric',
            title: 'Total Sales',
            query: 'SELECT SUM(total_amount) as total FROM orders',
            position: { x: 0, y: 0, w: 4, h: 2 },
          },
          {
            id: 'sales-chart',
            type: 'line-chart',
            title: 'Sales Over Time',
            query: 'SELECT DATE_TRUNC(\'month\', order_date) as month, SUM(total_amount) as total FROM orders GROUP BY month ORDER BY month',
            position: { x: 4, y: 0, w: 8, h: 4 },
          },
        ],
      },
      userId: users[0].id,
      organizationId: organization.id,
      isPublic: true,
    },
  })

  // Create sample API key
  await prisma.apiKey.create({
    data: {
      name: 'Demo API Key',
      key: 'na_demo_' + Math.random().toString(36).substring(2, 15),
      userId: users[0].id,
      organizationId: organization.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created ${users.length} users`)
  console.log(`🏢 Created organization: ${organization.name}`)
  console.log(`🔌 Created data source: ${dataSource.name}`)
  console.log(`📈 Created ${sampleQueries.length} sample queries`)
  console.log(`📊 Created dashboard: ${dashboard.name}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
