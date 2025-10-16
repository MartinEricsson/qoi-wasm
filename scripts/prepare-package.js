const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const wasmSource = path.join(rootDir, "src", "qoi-wasm", "qoi.min.wasm");
const entrySource = path.join(rootDir, "src", "qoi-wasm", "package-entry.js");

if (!fs.existsSync(wasmSource)) {
    throw new Error("Expected build artifact at src/qoi-wasm/qoi.min.wasm. Run the build step first.");
}

if (!fs.existsSync(entrySource)) {
    throw new Error("Missing package entry source at src/qoi-wasm/package-entry.js.");
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const wasmTarget = path.join(distDir, "qoi.wasm");
const entryTarget = path.join(distDir, "index.js");

fs.copyFileSync(wasmSource, wasmTarget);
fs.copyFileSync(entrySource, entryTarget);

console.log(`Package artifacts prepared in ${distDir}`);
