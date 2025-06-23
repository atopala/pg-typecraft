import postgres from "postgres";
import { newOneSqlSchema } from "./codegen/one_sql.schema.js";
import { POSTGRES_DATABASE, POSTGRES_PASSWORD, POSTGRES_USER } from "./config.js";

export const sql = postgres({
   host: "localhost",
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
