import path from "node:path";
import {getCodegenContext} from "../codegen-context.js";
import fs from "node:fs/promises";

const files = ["../../../@templates/types.ts"];

export async function writeLibrary() {
    const {outDir} = getCodegenContext();
    let output = "";
    for (const file of files) {
        const filePath = path.resolve(new URL(import.meta.url).pathname, file);
        const data = await fs.readFile(filePath, {encoding: "utf8"});
        output += "\n";
        output += data;
    }

    await fs.writeFile(path.resolve(outDir, "pg-typed.ts"), output, {
        encoding: "utf8",
    });
}