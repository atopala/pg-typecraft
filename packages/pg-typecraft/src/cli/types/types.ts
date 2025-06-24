import { SqlLiteralType } from "./sql-literal.js";
import { logger } from "../logger.js";

export interface SqlColumnInfo {
   column_default: string | null;
   column_name: string;
   domain_name?: string;
   udt_name?: string;
   is_nullable: "YES" | "NO";
   is_updatable: "YES" | "NO";
   numeric_precision_radix?: number;
}

export interface SqlTableInfo {
   table_name: string;
   table_columns: SqlColumnInfo[];
   table_schema: string;
   primary_key?: string;
}

export type SqlTableInfoArgs = Omit<SqlTableInfo, "table_columns"> & { table_columns: string };

export function SqlTableInfo({ table_columns, ...args }: SqlTableInfoArgs): SqlTableInfo {
   let data: undefined | SqlColumnInfo[];
   try {
      data = JSON.parse(table_columns) as SqlColumnInfo[];
   } catch (error) {
      logger.error({ json: table_columns }, `Error parsing table_columns from JSON text`);
      throw error;
   }

   return {
      ...args,
      table_columns: data,
   };
}

export interface SqlEnumValue {
   enum_label: string;
}

export interface SqlEnumInfo {
   enum_name: string;
   enum_schema: string;
   enum_values: SqlEnumValue[];
}

export interface SqlOutputFile {
   schemaName: string;
   moduleName: string;
   fileName: string;
   tableTypeName?: string;
}

export interface SqlTableKey {
   column_name: string;
   data_type: string;
}

export interface FindEnums {
   (args: { schemas: string[] }): Promise<SqlEnumInfo[]>;
}

export interface FindTables {
   (args: { schemas: string[] }): Promise<SqlTableInfo[]>;
}

export interface ColumnType {
   type: SqlLiteralType;
   udt?: string;
}

export enum SqlDialect {
   Postgres = "postgres",
}

export interface GetColumnType {
   (columns: SqlColumnInfo): ColumnType;
}

export interface CommandOptions {
   outDir: string;
   uri?: string;
   schema: string[];
   pascalCaseTables?: boolean;
   camelCaseColumns?: boolean;
   driver: "postgres" | "mssql";
   host?: string;
   database?: string;
   user?: string;
   password?: string;
   port?: number;
}

export interface PrintTableArgs {
   table: SqlTableInfo;
}
