const fs = require("fs");
const { spawnSync } = require("child_process");
const wabt = require("wabt")();
const path = require("path");

const compress = require("./compress");
const compile = require("./kömbi");

const [, , qoiFilename, ...restArgs] = process.argv;
const doWasmOpt = restArgs.includes("--opt") || process.env.WASM_OPT === "1";
const { name, dir } = path.parse(qoiFilename);
const basePath = path.join(dir, name);

const QOI_HEADER_SIZE = 14;
const QOI_END_SECTION_SIZE = 0; // 8 0x0 0x1
const INDEX_SECTION_SIZE = 256;

const inlineData = (data, offset = 0) => {
  const dataSize = data.length.toString(16);
  let dataBlock = "";
  for (let i = QOI_HEADER_SIZE; i < data.length - QOI_END_SECTION_SIZE; i++) {
    dataBlock = `${dataBlock}\\${data[i].toString(16).padStart(2, "0")}`;
  }

  return {
    block: `(data (i32.const ${offset}) "${dataBlock}")`,
    size: dataSize,
  };
};

const getNumberOfBlocks = (size) => ((size / 2 ** 16) | 0) + 1;

const parseHeader = (bytes) => {
  const magicString = `${String.fromCharCode(bytes[0])}${String.fromCharCode(
    bytes[1]
  )}${String.fromCharCode(bytes[2])}${String.fromCharCode(bytes[3])}`;

  const width =
    (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
  const height =
    (bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11];

  const channels = bytes[12];
  const colorspace = bytes[13];

  return {
    magicString,
    width,
    height,
    channels,
    colorspace,
  };
};

const qoiSrc = fs.readFileSync(qoiFilename);
const header = parseHeader(qoiSrc);

const decompressedSize = header.width * header.height * header.channels;
const qoiDataSize = qoiSrc.length - QOI_HEADER_SIZE - QOI_END_SECTION_SIZE;
const blocksForImg = getNumberOfBlocks(qoiDataSize);
const blocksForDecompressed = getNumberOfBlocks(decompressedSize);
const dataBlock = inlineData(qoiSrc, decompressedSize);

console.log(blocksForImg, blocksForDecompressed);
console.log(getNumberOfBlocks(qoiDataSize + decompressedSize));

const watSrc = compile({
  blocks: getNumberOfBlocks(
    qoiDataSize + decompressedSize + INDEX_SECTION_SIZE
  ),
  dataBlock: dataBlock.block,
  width: header.width,
  height: header.height,
  colorChannels: header.channels,
  decompSize: decompressedSize,
  qoiSize: qoiDataSize,
});

fs.writeFileSync(`${basePath}.wat`, watSrc);

wabt.then((compiler) => {
  debugger;
  const name = "temp.wast";
  const features = {
    multi_value: true,
  };

  const script = compiler.parseWat(name, watSrc, features);
  script.resolveNames();
  script.validate(features);
  const binaryOutput = script.toBinary({ log: true });
  let { buffer: binaryBuffer = null } = binaryOutput;

  fs.writeFileSync(`${basePath}.wasm`, binaryBuffer);
  console.log("Uncompressed size: ", binaryBuffer.length);

  // Optionally run wasm-opt for further size optimization
  if (doWasmOpt) {
    const outPath = `${basePath}.min.wasm`;
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = [
      "-y",
      "wasm-opt",
      "-Oz",
      "--enable-multivalue",
      "--strip-dwarf",
      "--strip-producers",
      "-o",
      outPath,
      `${basePath}.wasm`,
    ];

    const res = spawnSync(cmd, args, { stdio: "inherit" });
    if (res.status === 0) {
      const minBuffer = fs.readFileSync(outPath);
      console.log("Optimized size: ", minBuffer.length);
      compress(minBuffer, `${basePath}.wat.br`);
      return;
    } else {
      console.warn("wasm-opt failed or not available; using unoptimized wasm.");
    }
  }

  // Fallback: compress the original buffer
  compress(binaryBuffer, `${basePath}.wat.br`);
});
