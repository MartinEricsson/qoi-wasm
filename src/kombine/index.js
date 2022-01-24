const fs = require("fs");
const wabt = require("wabt")();
const path = require("path");

const compress = require("./compress");
const compile = require("./kömbi");

const [, , qoiFilename] = process.argv;
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
  compress(binaryBuffer, `${basePath}.wat.br`);
});
