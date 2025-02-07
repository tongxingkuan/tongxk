import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";
import { join } from "node:path";
import { readdir, unlink } from "node:fs/promises";
import { basename } from "node:path";

const firstArg = process.argv[2];

const getAllDirs = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name));

  const subDirs = await Promise.all(dirs.map((d) => getAllDirs(d)));
  return [dir, ...dirs, ...subDirs.flat()];
};

const run = async () => {
  const dirs = await getAllDirs(firstArg);

  for (const dir of dirs) {
    const target = `${dir}/*.{png,jpg,jpeg}`;
    console.log("Processing directory:", dir);

    const files = await imagemin([target], {
      destination: dir,
      plugins: [imageminWebp({ quality: 100 })],
    });

    if (files.length > 0) {
      console.log("Converted files in", dir + ":");
      console.log(
        files.map(({ destinationPath }) => destinationPath).join("\n"),
      );

      // Delete original files after successful conversion
      for (const file of files) {
        const originalPath = join(dir, basename(file.sourcePath));
        await unlink(originalPath);
        console.log("Deleted original file:", originalPath);
      }
    }
  }

  console.log("All images converted successfully!");
};

run();
