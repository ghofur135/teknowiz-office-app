import { Pool, PoolClient, QueryResult } from 'pg';

let pool: Pool | null = null;

export interface DbExecuteResult {
  rows: any[];
  rowsAffected: number;
}

export interface DbClientInterface {
  execute(query: string | { sql: string; args?: any[] }): Promise<DbExecuteResult>;
}

export function getDb(): DbClientInterface {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing for PostgreSQL connection.');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return {
    async execute(query: string | { sql: string; args?: any[] }): Promise<DbExecuteResult> {
      let rawSql = typeof query === 'string' ? query : query.sql;
      const args = typeof query === 'string' ? [] : (query.args || []);

      // 1. Transform SQLite strftime to PostgreSQL to_char
      // strftime('%Y-%m', date_col) -> to_char(date_col, 'YYYY-MM')
      rawSql = rawSql.replace(/strftime\s*\(\s*'%Y-%m'\s*,\s*([a-zA-Z0-9_\.]+)\s*\)/gi, "to_char($1, 'YYYY-MM')");
      // strftime('%Y', date_col) -> to_char(date_col, 'YYYY')
      rawSql = rawSql.replace(/strftime\s*\(\s*'%Y'\s*,\s*([a-zA-Z0-9_\.]+)\s*\)/gi, "to_char($1, 'YYYY')");

      // 2. Transform positional parameters '?' to '$1, $2, ...'
      let paramIndex = 1;
      let transformedSql = '';
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < rawSql.length; i++) {
        const char = rawSql[i];
        if (!inQuote && (char === "'" || char === '"')) {
          inQuote = true;
          quoteChar = char;
          transformedSql += char;
        } else if (inQuote && char === quoteChar) {
          inQuote = false;
          quoteChar = '';
          transformedSql += char;
        } else if (!inQuote && char === '?') {
          transformedSql += `$${paramIndex++}`;
        } else {
          transformedSql += char;
        }
      }

      const client: PoolClient = await pool!.connect();
      try {
        const res: QueryResult = await client.query(transformedSql, args);
        return {
          rows: res.rows || [],
          rowsAffected: res.rowCount || 0
        };
      } finally {
        client.release();
      }
    }
  };
}

