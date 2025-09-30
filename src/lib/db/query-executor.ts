import { ConnectionManager } from './connection-manager';
import { DataSource } from '@prisma/client';
import OpenAI from 'openai';

interface QueryExecutorOptions {
  dataSource: DataSource;
  naturalQuery: string;
  userId: string;
}

interface QueryResult {
  sqlQuery: string;
  result: Record<string, unknown>[];
  executionTime: number;
  status: 'completed' | 'failed';
  error?: string;
}

export class QueryExecutor {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async execute({
    dataSource,
    naturalQuery
  }: QueryExecutorOptions): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Get database schema
      const schema = await this.getDatabaseSchema(dataSource);
      
      // Generate SQL from natural language
      const sqlQuery = await this.generateSQL(naturalQuery, schema, dataSource.type);
      
      if (!sqlQuery) {
        throw new Error('Failed to generate SQL query');
      }

      // Validate SQL for safety
      this.validateSQL(sqlQuery);
      
      // Get database connection
      const connection = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type,
        dataSource.connectionString
      );
      
      // Execute query
      const result = await connection.query(sqlQuery);
      
      const executionTime = Date.now() - startTime;
      
      return {
        sqlQuery,
        result,
        executionTime,
        status: 'completed'
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        sqlQuery: '',
        result: [],
        executionTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getDatabaseSchema(dataSource: DataSource): Promise<string> {
    const connection = await ConnectionManager.getConnection(
      dataSource.id,
      dataSource.type,
      dataSource.connectionString
    );

    let schemaQuery: string;

    switch (dataSource.type) {
      case 'POSTGRESQL':
        schemaQuery = `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position
        `;
        break;
      case 'MYSQL':
        schemaQuery = `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
          ORDER BY table_name, ordinal_position
        `;
        break;
      case 'BIGQUERY':
        schemaQuery = `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
          FROM INFORMATION_SCHEMA.COLUMNS
          ORDER BY table_name, ordinal_position
        `;
        break;
      default:
        throw new Error(`Unsupported database type: ${dataSource.type}`);
    }

    const schemaInfo = await connection.query(schemaQuery);
    
    // Format schema info into a readable string
    const tables = new Map<string, Array<Record<string, unknown>>>();
    for (const row of schemaInfo) {
      const tableName = String(row.table_name);
      if (!tables.has(tableName)) {
        tables.set(tableName, []);
      }
      tables.get(tableName)!.push(row);
    }

    let schemaStr = `Database Schema:\n\n`;
    for (const [tableName, columns] of tables) {
      schemaStr += `Table: ${tableName}\n`;
      for (const col of columns) {
        schemaStr += `  - ${String(col.column_name)} (${String(col.data_type)}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})\n`;
      }
      schemaStr += '\n';
    }

    return schemaStr;
  }

  private async generateSQL(
    naturalQuery: string,
    schema: string,
    dbType: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert. Convert natural language queries to SQL.
            
${schema}

Database Type: ${dbType}

Rules:
1. Only use tables and columns that exist in the schema
2. Return valid ${dbType} syntax
3. Use appropriate JOINs when needed
4. Include proper WHERE clauses for filtering
5. Use aggregate functions (SUM, COUNT, AVG, etc.) when appropriate
6. Return only the SQL query, no explanations
7. For date/time operations, use database-specific functions
8. Always limit results to 1000 rows unless specifically asked for more
9. Use proper escaping for identifiers if needed`
        },
        { role: "user", content: naturalQuery }
      ],
      temperature: 0.1,
    });

    const sql = completion.choices[0]?.message?.content?.trim();
    
    // Add LIMIT if not present (safety measure)
    if (sql && !sql.toLowerCase().includes('limit')) {
      return sql + ' LIMIT 1000';
    }
    
    return sql || '';
  }

  private validateSQL(sql: string): void {
    const lowerSQL = sql.toLowerCase();
    
    // Prevent dangerous operations
    const dangerousKeywords = [
      'drop', 'delete', 'truncate', 'alter', 'create',
      'update', 'insert', 'grant', 'revoke', 'execute',
      'exec', 'xp_', 'sp_', 'into outfile', 'into dumpfile'
    ];
    
    for (const keyword of dangerousKeywords) {
      if (lowerSQL.includes(keyword)) {
        throw new Error(`Potentially dangerous SQL operation detected: ${keyword}`);
      }
    }

    // Check for common SQL injection patterns
    const injectionPatterns = [
      /;\s*--/,  // Semicolon followed by comment
      /\bunion\s+select\b/i,  // UNION SELECT
      /\bor\s+1\s*=\s*1\b/i,  // OR 1=1
      /\bwaitfor\s+delay\b/i,  // WAITFOR DELAY
      /\bsleep\s*\(/i,  // SLEEP()
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(sql)) {
        throw new Error('Potential SQL injection detected');
      }
    }
  }
}