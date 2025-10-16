"use strict";

const path = require("path");

const wasmPath = path.join(__dirname, "qoi.wasm");

const isNodeRuntime =
    typeof process !== "undefined" &&
    process.versions !== undefined &&
    process.versions.node !== undefined;

const fs = isNodeRuntime ? eval("require")("fs") : null;

function loadWasmBytes() {
    if (!fs) {
        throw new Error("File system access is only available in Node.js environments.");
    }

    return fs.readFileSync(wasmPath);
}

async function instantiate(importObject = {}) {
    if (!fs) {
        throw new Error("instantiate is only supported in Node.js. Use wasmPath in browsers.");
    }

    const bytes = await fs.promises.readFile(wasmPath);
    return WebAssembly.instantiate(bytes, importObject);
}

function instantiateSync(importObject = {}) {
    const module = compileSync();
    const instance = new WebAssembly.Instance(module, importObject);

    return { module, instance };
}

function compileSync() {
    return new WebAssembly.Module(loadWasmBytes());
}

module.exports = {
    instantiate,
    instantiateSync,
    compileSync,
    wasmPath
};
