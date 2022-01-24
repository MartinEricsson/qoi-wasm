const brotli = require("brotli");
const fs = require("fs");

const compress = (data, path = "./test.wasm.br") => {
  const result = brotli.compress(data, {
    extension: "br",
    skipLarger: true,
    mode: 1,
    quality: 11,
    lgwin: 20,
  });

  fs.writeFileSync(path, result);

  console.log("Compressed size", result.length);

  return result;
};

module.exports = compress;
