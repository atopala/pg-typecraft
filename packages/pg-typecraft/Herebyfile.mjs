import { task } from "hereby";
import fs from "node:fs/promises";
import path from "node:path";

export const preinstall = task({
   name: "preinstall",
   run: async () => {
      const dirExists = await fs
         .access(path.resolve("./dist"))
         .then(() => true)
         .catch(() => false);
      if (!dirExists) {
         await fs.mkdir(path.resolve("./dist/cli"), { recursive: true });
      }

      const fileExists = await fs
         .access(path.resolve("./dist/cli/main.js"))
         .then(() => true)
         .catch(() => false);
      if (!fileExists) {
         await fs.writeFile(path.resolve("./dist/cli/main.js"), "");
      }
   },
});
