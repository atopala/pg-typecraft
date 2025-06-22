import postgres, { PendingQuery, Row } from "postgres";
import { newSqlTyped, SqlTyped } from "./sql-typed.js";

export class SqlTable<
   T extends {
      Table: { $from: string; $all: string[] };
      Insert: Row;
      Select: object;
      Update: object
   },
> {
   private readonly $table: SqlTyped<T["Table"]>;

   constructor(table: T["Table"], private readonly sql: postgres.Sql) {
      this.$table = newSqlTyped(sql, table);
   }

   select<Include extends Record<string, unknown>>(args?: {
      where?: postgres.PendingQuery<Row[]>,
      limit?: number,
      orderBy?: postgres.PendingQuery<Row[]>,
      include?: Include
   }): PendingQuery<T["Select"][]> {
      const { where, include, orderBy, limit } = args ?? {};
      const { $from, $all } = this.$table;
      const psql = this.sql;
      // const lines = [];
      let selects: Array<PendingQuery<Row[]>> | undefined = undefined;
      let joins: Array<PendingQuery<Row[]>> | undefined = undefined;
      if (include) {
         selects = [];
         joins = [];
         for (const [key, value] of Object.entries(include) as Array<[string, PendingQuery<Row[]>]>) {
            selects.push(psql`\ncoalesce(jsonb_agg(${psql(key)}) filter (where ${psql(key)}.* is not null),'[]') as ${psql(key)}`);
            joins.push(psql`\nleft join lateral (${value}) as ${psql(key)} on true`);
         }
      }

      const result = psql<T["Select"][]>`
         select ${$all}
                   ${selects?.length ? psql`, ` : psql``}
                   ${selects ?? psql``}
         from ${$from} ${joins ?? psql``} ${
            where
               ? psql`where
               ${where}`
               : psql``
         } ${joins?.length ? psql`group by ${$all}` : psql``}
            ${orderBy ? "order by " : ""} ${orderBy ?? psql``}
            ${limit ? psql`limit ${limit}` : psql``}
      `;

      return result;
   }

   insert(...values: Array<T["Insert"]>): PendingQuery<T["Select"][]> {
      const { $from, $all } = this.$table;
      const psql = this.sql;
      return psql<T["Select"][]>`
         insert into ${$from} ${psql(values as Row)}
            returning ${$all}
      `;
   }

   update(value: T["Update"], where: postgres.PendingQuery<Row[]>): PendingQuery<T["Select"][]> {
      const { $from, $all } = this.$table;
      const psql = this.sql;
      return psql<T["Select"][]>`
         update ${$from}
         set ${psql(value as Row)}
         where ${where}
         returning ${$all}
      `;
   }

   delete(where: ReturnType<postgres.Sql>): PendingQuery<T["Select"][]> {
      const { $from, $all } = this.$table;
      const psql = this.sql;
      return psql<T["Select"][]>`
         delete
         from ${$from}
         where ${where}
         returning ${$all}
      `;
   }
}
