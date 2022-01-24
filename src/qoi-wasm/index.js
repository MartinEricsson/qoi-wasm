const wabt = require("wabt");
const fs = require("fs");

(async (_) => {
  const compiler = await wabt();
  const qoiSrc = fs.readFileSync("./src/qoi-wasm/qoi.wat", {
    encoding: "utf8",
  });
  const features = {
    multi_value: true,
  };
  const script = compiler.parseWat("temp.wast", qoiSrc, features);
  script.resolveNames();
  script.validate(features);
  const binaryOutput = script.toBinary({ log: true });
  let { buffer: binaryBuffer = null } = binaryOutput;

  fs.writeFileSync("./src/qoi-wasm/qoi.wasm", binaryBuffer);
  console.log(`- File written, size: ${binaryBuffer.length} bytes -`);
})();
