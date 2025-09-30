import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import { BigQuery } from '@google-cloud/bigquery';
import { DataSourceType } from '@prisma/client';

export interface DatabaseConnection {
  query: (sql: string) => Promise<Record<string, unknown>[]>;
  testConnection: () => Promise<boolean>;
  close: () => Promise<void>;
}

export class ConnectionManager {
  private static connections = new Map<string, DatabaseConnection>();

  static async getConnection(
    id: string,
    type: DataSourceType,
    connectionString: string
  ): Promise<DatabaseConnection> {
    // Check if connection already exists
    if (this.connections.has(id)) {
      return this.connections.get(id)!;
    }

    let connection: DatabaseConnection;

    switch (type) {
      case 'POSTGRESQL':
        connection = await this.createPostgreSQLConnection(connectionString);
        break;
      case 'MYSQL':
        connection = await this.createMySQLConnection(connectionString);
        break;
      case 'BIGQUERY':
        connection = await this.createBigQueryConnection(connectionString);
        break;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }

    this.connections.set(id, connection);
    return connection;
  }

  private static async createPostgreSQLConnection(
    connectionString: string
  ): Promise<DatabaseConnection> {
    const client = new PgClient(connectionString);
    await client.connect();

    return {
      query: async (sql: string) => {
        const result = await client.query(sql);
        return result.rows;
      },
      testConnection: async () => {
        try {
          await client.query('SELECT 1');
          return true;
        } catch {
          return false;
        }
      },
      close: async () => {
        await client.end();
        ConnectionManager.connections.forEach((conn, key) => {
          if (conn === this.connections.get(key)) {
            ConnectionManager.connections.delete(key);
          }
        });
      }
    };
  }

  private static async createMySQLConnection(
    connectionString: string
  ): Promise<DatabaseConnection> {
    // Parse MySQL connection string
    const url = new URL(connectionString.replace('mysql://', 'http://'));
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1)
    });

    return {
      query: async (sql: string) => {
        const [rows] = await connection.execute(sql);
        return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
      },
      testConnection: async () => {
        try {
          await connection.execute('SELECT 1');
          return true;
        } catch {
          return false;
        }
      },
      close: async () => {
        await connection.end();
        ConnectionManager.connections.forEach((conn, key) => {
          if (conn === this.connections.get(key)) {
            ConnectionManager.connections.delete(key);
          }
        });
      }
    };
  }

  private static async createBigQueryConnection(
    connectionString: string
  ): Promise<DatabaseConnection> {
    // Parse BigQuery connection string format: bigquery://project_id/dataset_id?key_file=path
    const url = new URL(connectionString.replace('bigquery://', 'http://'));
    const projectId = url.hostname;
    const keyFilePath = url.searchParams.get('key_file');

    const bigquery = new BigQuery({
      projectId,
      keyFilename: keyFilePath || undefined
    });

    return {
      query: async (sql: string) => {
        const options = {
          query: sql,
          location: 'US',
        };

        const [job] = await bigquery.createQueryJob(options);
        const [rows] = await job.getQueryResults();
        return rows;
      },
      testConnection: async () => {
        try {
          await bigquery.query('SELECT 1');
          return true;
        } catch {
          return false;
        }
      },
      close: async () => {
        // BigQuery doesn't require explicit connection closing
        ConnectionManager.connections.forEach((conn, key) => {
          if (conn === this.connections.get(key)) {
            ConnectionManager.connections.delete(key);
          }
        });
      }
    };
  }

  static async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await connection.close();
      this.connections.delete(connectionId);
    }
  }

  static async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.entries()).map(
      ([, conn]) => conn.close()
    );
    await Promise.all(promises);
    this.connections.clear();
  }
}