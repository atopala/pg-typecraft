import path from "node:path";
import { getCodegenContext } from "../codegen-context.js";
import fs from "node:fs/promises";
import { SqlOutputFile } from "../types/index.js";

const files = ["../../../@templates/types.ts"];

export type LibraryOutputFile = Pick<SqlOutputFile, "fileName">;

export async function writeLibrary(): Promise<LibraryOutputFile[]> {
   const { outDir } = getCodegenContext();
   const filePath = path.resolve(outDir, "pg-typed.ts");
   let output = "";
   for (const file of files) {
      const filePath = path.resolve(new URL(import.meta.url).pathname, file);
      const data = await fs.readFile(filePath, { encoding: "utf8" });
      output += "\n";
      output += data;
   }

   await fs.writeFile(filePath, output, {
      encoding: "utf8",
   });

   return [
      {
         fileName: "pg-typed",
      },
   ];
}
