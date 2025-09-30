import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { QueryExecutor } from '@/lib/db/query-executor';
import OpenAI from 'openai';

// Keep sample schema for demo mode
const SAMPLE_SCHEMA = `
-- Sample e-commerce database schema
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  country VARCHAR(50),
  city VARCHAR(50)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Sample data for demo - same as before
const SAMPLE_DATA = {
  customers: [
    { id: 1, name: 'John Doe', email: 'john@example.com', country: 'USA', city: 'New York' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', country: 'Canada', city: 'Toronto' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', country: 'USA', city: 'Los Angeles' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', country: 'UK', city: 'London' },
  ],
  products: [
    { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
    { id: 2, name: 'Phone', category: 'Electronics', price: 699.99 },
    { id: 3, name: 'Book', category: 'Education', price: 29.99 },
    { id: 4, name: 'Headphones', category: 'Electronics', price: 199.99 },
  ],
  orders: [
    { id: 1, customer_id: 1, product_id: 1, quantity: 1, total_amount: 999.99, order_date: '2024-01-15', status: 'completed' },
    { id: 2, customer_id: 2, product_id: 2, quantity: 2, total_amount: 1399.98, order_date: '2024-01-16', status: 'completed' },
    { id: 3, customer_id: 1, product_id: 3, quantity: 3, total_amount: 89.97, order_date: '2024-01-17', status: 'pending' },
    { id: 4, customer_id: 3, product_id: 4, quantity: 1, total_amount: 199.99, order_date: '2024-01-18', status: 'completed' },
  ],
  sales: [
    { id: 1, order_id: 1, product_id: 1, quantity: 1, unit_price: 999.99, total_price: 999.99, sale_date: '2024-01-15' },
    { id: 2, order_id: 2, product_id: 2, quantity: 2, unit_price: 699.99, total_price: 1399.98, sale_date: '2024-01-16' },
    { id: 3, order_id: 4, product_id: 4, quantity: 1, unit_price: 199.99, total_price: 199.99, sale_date: '2024-01-18' },
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { query, dataSourceId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check if demo mode (no dataSourceId provided)
    if (!dataSourceId) {
      return handleDemoQuery(query);
    }

    // Get session for authenticated queries
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get data source with access check
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!dataSource || dataSource.organization.members.length === 0) {
      return NextResponse.json(
        { error: 'Data source not found or access denied' },
        { status: 403 }
      );
    }

    if (!dataSource.isActive) {
      return NextResponse.json(
        { error: 'Data source is not active' },
        { status: 400 }
      );
    }

    // Execute query using real database
    const queryExecutor = new QueryExecutor();
    const result = await queryExecutor.execute({
      dataSource,
      naturalQuery: query,
      userId: user.id
    });

    // Save query to database for history
    await prisma.query.create({
      data: {
        naturalQuery: query,
        sqlQuery: result.sqlQuery,
        result: result.result as Record<string, unknown>, // Prisma JSON type limitation
        status: result.status === 'completed' ? 'COMPLETED' : 'FAILED',
        executionTime: result.executionTime,
        userId: user.id,
        dataSourceId: dataSource.id
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Query processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

// Demo mode handler - same as before
async function handleDemoQuery(query: string) {
  // Generate SQL using OpenAI if available; otherwise use a simple fallback
  let sqlQuery: string | undefined;
  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert. Convert the natural language query to SQL.
          
          Database Schema:
          ${SAMPLE_SCHEMA}
          
          Rules:
          1. Only use the tables and columns defined in the schema
          2. Return valid PostgreSQL syntax
          3. Use appropriate JOINs when needed
          4. Include proper WHERE clauses for filtering
          5. Use aggregate functions (SUM, COUNT, AVG, etc.) when appropriate
          6. Return only the SQL query, no explanations
          7. If the query is ambiguous, make reasonable assumptions
          8. For date ranges, use current year (2024) as reference
          
          Sample data context:
          - Customers: John Doe (USA), Jane Smith (Canada), Bob Johnson (USA), Alice Brown (UK)
          - Products: Laptop ($999.99), Phone ($699.99), Book ($29.99), Headphones ($199.99)
          - Orders: Various orders from January 2024
          - Sales: Completed sales transactions`
        },
        { role: "user", content: query }
      ],
      temperature: 0.1,
    });
    sqlQuery = completion.choices[0]?.message?.content?.trim();
  } else {
    sqlQuery = generateSqlFallback(query);
  }

  if (!sqlQuery) {
    return NextResponse.json({ error: 'Failed to generate SQL query' }, { status: 500 });
  }

  // For demo purposes, we'll simulate query execution with sample data
  const mockResult = executeMockQuery(sqlQuery);

  return NextResponse.json({
    sqlQuery,
    result: mockResult,
    executionTime: Math.floor(Math.random() * 1000) + 100, // Mock execution time
    status: 'completed'
  });
}

// Mock query execution for demo purposes
function executeMockQuery(sql: string): Record<string, unknown>[] {
  // This is a simplified mock - in production, you'd use a real database
  const lowerSql = sql.toLowerCase();
  
  // Simple pattern matching for demo
  if (lowerSql.includes('count') && lowerSql.includes('customers')) {
    return [{ count: SAMPLE_DATA.customers.length }];
  }
  
  if (lowerSql.includes('sum') && lowerSql.includes('total_amount')) {
    const total = SAMPLE_DATA.orders.reduce((sum, order) => sum + order.total_amount, 0);
    return [{ total_amount: total }];
  }
  
  if (lowerSql.includes('customers') && lowerSql.includes('country')) {
    return SAMPLE_DATA.customers.map(c => ({ name: c.name, country: c.country }));
  }
  
  if (lowerSql.includes('products') && lowerSql.includes('category')) {
    return SAMPLE_DATA.products.map(p => ({ name: p.name, category: p.category, price: p.price }));
  }
  
  if (lowerSql.includes('orders') && lowerSql.includes('status')) {
    return SAMPLE_DATA.orders.map(o => ({ 
      id: o.id, 
      total_amount: o.total_amount, 
      status: o.status,
      order_date: o.order_date 
    }));
  }
  
  // Default fallback
  return [
    { message: 'Query executed successfully', 
      note: 'This is demo data. In production, this would return actual database results.' 
    }
  ];
}

function generateSqlFallback(nl: string): string {
  const q = nl.toLowerCase();
  if (q.includes('count') && q.includes('customers')) return 'SELECT COUNT(*) AS count FROM customers;';
  if (q.includes('sum') && (q.includes('total') || q.includes('revenue') || q.includes('sales'))) return 'SELECT SUM(total_amount) AS total_amount FROM orders;';
  if (q.includes('customers') && q.includes('country')) return 'SELECT name, country FROM customers;';
  if (q.includes('products') && q.includes('category')) return 'SELECT name, category, price FROM products;';
  if (q.includes('orders') && q.includes('status')) return 'SELECT id, total_amount, status, order_date FROM orders;';
  return 'SELECT 1;';
}