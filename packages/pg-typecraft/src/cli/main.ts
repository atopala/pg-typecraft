import { Command, Option } from "commander";
import * as console from "node:console";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { writeIndex } from "./write-index.js";
import { printEnums, printSchemas } from "./schemas/index.js";
import { CodegenContext, CodegenContextModel, getCodegenContext } from "./codegen-context.js";
import * as psql from "./psql/index.js";
import postgres from "postgres";
import { CommandOptions, SqlDialect, SqlEnumInfo, SqlTableInfo } from "./types/index.js";
import { printTables } from "./tables/index.js";
import { ok } from "assert";
import { logger } from "./logger.js";
import { writeLibrary } from "./lib/index.js";

const main = new Command();

main
   .name("pg-typecraft")
   .description(
      `A powerful TypeScript code generator that creates type-safe mappings from PostgreSQL schemas to TypeScript, enabling type-safe SQL queries with [**postgres.js**](https://www.npmjs.com/package/postgres).`,
   )
   .command("generate")
   //.argument('<tableName>')
   .description("Generates SQL mapping for specified database")
   .addOption(new Option("--driver <driver>", "Database name").choices(["postgres", "mssql"]).default("postgres"))
   .addOption(
      new Option("--uri <uri>", "Database connection URI")
         .conflicts(["host", "port", "user", "password", "database"])
         .makeOptionMandatory(false),
   )
   .requiredOption("--outDir <directory>", "Output directory to generate the mapping files into")
   .requiredOption("--schema <schema...>", "Database schema(s) to generate mapping code for")
   .option("--host <host>", "Database host")
   .option("--database <database>", "Input database to map")
   .option("--user <user>", "Database user")
   .option("--password <password>", "Database password")
   .addOption(new Option("--port <port>", "Database port").preset("5432").argParser(parseInt))
   .option("--pascalCaseTables", "Use PascalCase for table names")
   .option("--camelCaseColumns", "Use camelCase for column names")
   .action(async (options: CommandOptions) => {
      const {
         uri,
         schema: schemas,
         pascalCaseTables,
         camelCaseColumns,
         driver,
         host,
         port,
         user,
         database,
         password,
      } = options;
      const outDir = path.resolve(options.outDir);
      const dirExists = await fs.stat(outDir);
      if (!dirExists?.isDirectory()) {
         console.error(`${outDir} is not a valid output directory`);
         return;
      }

      let context: CodegenContextModel | undefined;
      let tables: SqlTableInfo[] | undefined;
      let enums: SqlEnumInfo[] | undefined;
      switch (driver) {
         case "postgres": {
            const sql = (() => {
               if (uri)
                  return postgres(uri, {
                     debug(...args) {
                        logger.trace(args);
                     },
                  });

               if (host && database && user) {
                  return postgres({
                     host,
                     port,
                     user,
                     password,
                     database,
                     debug(...args) {
                        logger.trace(args);
                     },
                  });
               }

               throw new Error(`Invalid database connection parameters: host, database and user are required`);
            })();
            tables = await psql.findTables(sql)({ schemas });
            enums = await psql.findEnums(sql)({ schemas });
            logger.info(
               {
                  postgres: {
                     host,
                     port,
                     database,
                     user,
                     password: password ? "********" : undefined,
                  },
                  schemas,
                  tables: tables.map(({ table_name, table_schema }) => ({ table_schema, table_name })),
                  enums: enums.map(({ enum_name, enum_schema }) => ({ enum_schema, enum_name })),
               },
               `Generating mapping code for ${schemas.join(", ")}`,
            );
            await sql.end();
            context = new CodegenContextModel({
               outDir,
               getColumnType: psql.getColumnType,
               dialect: SqlDialect.Postgres,
               pascalCaseTables,
               camelCaseColumns,
               includeEnums: enums?.length > 0,
            });

            break;
         }
         default:
            throw new Error(`Unsupported driver: ${driver}`);
      }

      const files = await fs.readdir(outDir);
      for (const file of files) {
         await fs.rm(path.join(outDir, file));
      }

      await CodegenContext.run(context, async () => {
         const { outDir } = getCodegenContext();
         ok(outDir, "outDir is not defined");
         ok(tables, "tables are not defined");
         ok(enums, "enums are not defined");

         const enumFiles = await printEnums({ enums });
         const tableFiles = await printTables({
            tables,
         });

         const schemaFiles = await printSchemas({
            files: [...tableFiles, ...enumFiles],
         });

         const libraryFiles = await writeLibrary();

         await writeIndex({
            libraryFiles,
            schemaFiles,
         });
      });
   });

main.parse();
