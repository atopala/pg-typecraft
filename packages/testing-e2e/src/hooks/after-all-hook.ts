import { AfterAll } from "@cucumber/cucumber";
import { sql } from "../db.js";

AfterAll(async () => {
   await sql.end();
});
