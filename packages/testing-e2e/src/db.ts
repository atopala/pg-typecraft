import postgres from "postgres";
import { newOneSqlSchema } from "./codegen/one_sql.schema.js";

export const sql = postgres({
   host: "localhost",
   user: "postgres",
   database: "postgres",
   transform: {
      ...postgres.camel,
      undefined: null,
   },
   debug: (...args) => {
      console.log("sql:", ...args);
   },
});

export const { Account, Order } = newOneSqlSchema(sql);
