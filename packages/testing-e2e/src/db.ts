import postgres from "postgres";
import { newOneSqlSchema } from "./codegen/one_sql.schema.js";
import { POSTGRES_DATABASE, POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_HOST, POSTGRES_PORT } from "./config.js";

export const sql = postgres({
   host: POSTGRES_HOST,
   port: POSTGRES_PORT,
   user: POSTGRES_USER,
   password: POSTGRES_PASSWORD,
   database: POSTGRES_DATABASE,
   transform: {
      ...postgres.camel,
      undefined: null,
   },
   debug: (...args) => {
      console.log("sql:", ...args);
   },
});

export const { Account, Order } = newOneSqlSchema(sql);
