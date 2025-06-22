import postgres from "postgres";
import { SqlEnumInfo } from "../types/index.js";

/**
 * Query all enums in the given schema
 * @param sql
 */
export function findEnums(sql: postgres.Sql) {
   return async function ({ schemas }: { schemas: string[] }): Promise<SqlEnumInfo[]> {
      return await sql<SqlEnumInfo[]>`
         with enum_values as (select oid,
                                     enumtypid     as enum_typ_id,
                                     enumlabel     as enum_label,
                                     enumsortorder as enum_sort_order
                              from pg_enum)
         SELECT T.typname   as enum_name,
                n.nspname   as enum_schema,
                json_agg(E) as enum_values
         FROM pg_type as T
                 join enum_values E on T.oid = E.enum_typ_id
                 join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
         where T.typcategory = 'E'
           and n.nspname in ${sql(schemas)}
         group by T.oid, T.typname, T.typelem, n.nspname
      `;
   };
}
