import { createServer } from "http";
import { join } from "path";
import { promises as fs } from "fs";

const [, , port = 9999] = process.argv;

const mimeTypes = {
  css: "text/css",
  gif: "image/gif",
  html: "text/html",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  mjs: "text/javascript",
  png: "image/png",
  svg: "image/svg+xml",
  wasm: "application/wasm",
};

const main = async ({ url, headers }, response) => {
  try {
    let filename = join(
      process.cwd(),
      new URL(url, `http://${headers.host}/`).pathname
    );
    const stat = await fs.stat(filename);
    filename = `${filename}${stat.isDirectory() ? "/index.html" : ""}`;
    const file = await fs.readFile(filename, "binary");
    response.writeHead(200, {
      "Content-Type": mimeTypes[filename.split(".").pop()] || "text/plain",
    });
    response.write(file, "binary");
  } catch (e) {
    if (e.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write("404 Not Found");
    } else {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.write(`${e}`);
    }
  } finally {
    response.end();
  }
};

createServer(main).listen(parseInt(port, 10));
console.log(`Up at http://localhost:${port}`);
