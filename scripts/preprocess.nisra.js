/* eslint import/no-extraneous-dependencies: 0 */
const path = require('path');
const fs = require('fs');
const { Transform } = require('stream');
const mkdirp = require('mkdirp');
const { output: { path: outputDir } } = require('../webpack.common.js');

const outPath = path.resolve(outputDir, 'data');
mkdirp.sync(outPath);

// minify json helper
function minify(inFilename, outFilename) {
  const inFile = path.resolve(__dirname, '../src', 'nisra', 'data', inFilename);
  const outFile = path.resolve(outPath, outFilename);
  const inStream = fs.createReadStream(inFile);
  const outStream = fs.createWriteStream(outFile);
  const minifier = new Transform({
    objectMode: true,
    transform(chunk, encoding, done) {
      const data = chunk.toString().replace(/\s+/g, '');
      minifier.push(data);
      done();
    }
  });
  inStream.pipe(minifier).pipe(outStream);
}

// filter commodities helper
function commoditiesFilter(inFilename, outFilename) {
  const inFile = path.resolve(__dirname, '../src', 'nisra', 'data', inFilename);
  const outFile = path.resolve(outPath, outFilename);
  const rawdata = fs.readFileSync(inFile);
  const data = JSON.parse(rawdata);
  data.results = data.results.filter(({ id }) => !(id === 'TOTAL' || id === 'AG2' || id === 'ALL' || id.length === 2));
  fs.writeFileSync(outFile, JSON.stringify(data));
}

// copy file
function copyFile(inFilename, outFilename) {
  const inFile = path.resolve(__dirname, '../src', 'nisra', 'data', inFilename);
  const outFile = path.resolve(outPath, outFilename);
  const inStream = fs.createReadStream(inFile);
  const outStream = fs.createWriteStream(outFile);
  inStream.pipe(outStream);
}

console.log('Begin data assets minification');
console.log('Data assets minification completed');
