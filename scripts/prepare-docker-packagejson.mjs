import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const name of [
  "firebase-tools",
  "@firebase/rules-unit-testing",
  "vitest",
  "@testing-library/dom",
  "@testing-library/react",
  "@testing-library/user-event",
  "jsdom",
]) {
  delete pkg.devDependencies?.[name];
}
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
