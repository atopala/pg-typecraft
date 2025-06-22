import fs from "fs";
import path from "path";
import { SqlOutputFile } from "./types/index.js";
import { getCodegenContext } from "./codegen-context.js";

const writeFile = fs.promises.writeFile;

export interface WriteIndexArgs {
   files: Pick<SqlOutputFile, "moduleName" | "fileName">[];
}

export async function writeIndex({ files }: WriteIndexArgs): Promise<void> {
   const { outDir } = getCodegenContext();
   const data = printIndex(files);
   await writeFile(path.join(outDir, "index.ts"), data);
}

function printIndex(files: Pick<SqlOutputFile, "fileName" | "moduleName">[]): string {
   return (
      files.map(({ moduleName, fileName }) => `export * as ${moduleName} from "./${fileName}.js";`).join("\n") + "\n"
   );
}
