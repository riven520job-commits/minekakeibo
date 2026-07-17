import { copyFile, mkdir } from "node:fs/promises";

await mkdir(new URL("../assets/vendor/", import.meta.url), { recursive: true });

const files = [
  ["../node_modules/chart.js/dist/chart.umd.js", "../assets/vendor/chart.umd.js"],
  [
    "../node_modules/@supabase/supabase-js/dist/umd/supabase.js",
    "../assets/vendor/supabase.js",
  ],
];

await Promise.all(
  files.map(([source, destination]) =>
    copyFile(new URL(source, import.meta.url), new URL(destination, import.meta.url)),
  ),
);
