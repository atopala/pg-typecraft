import postgres from "postgres";
import { SqlTableInfo } from "../types/index.js";

/**
 * Query all tables in the given schema
 * @param sql
 */
export function findTables(sql: postgres.Sql) {
   return async function ({ schemas }: { schemas: string[] }): Promise<SqlTableInfo[]> {
      return await sql<SqlTableInfo[]>`
         select c.table_name, c.table_schema, json_agg(c) as table_columns, tc.constraint_name as primary_key
         from information_schema.columns as c
                 left join information_schema.table_constraints tc
                           on c.table_name = tc.table_name and tc.constraint_type = 'PRIMARY KEY'
         where c.table_schema in ${sql(schemas)}
         group by c.table_name, c.table_schema,
                  tc.constraint_name
      `;
   };
}
