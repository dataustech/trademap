/*
 
 */

/* eslint max-len: 0 */
const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '../../src/nisra/api');
const destDirByReporterYear = path.join(__dirname, '../../dist/nisra/api/byReporterYear');
const destDirByReporterSitc = path.join(__dirname, '../../dist/nisra/api/byReporterSitc');
const rowRegex = /^([1-4])Q(\d{4})([IE])([A-Z]{2})([A-J])([A-Z0-9 ]{3})([A-Z0-9#]{2})(\d)(\d{2})([ 0-9]{9})([ 0-9]{9})/;
const data = {
  byHash: {},
  byReporterYear: {},
  byReporterSitc: {}
};
const outputFields = ['year', 'flow', 'nuts1', 'codalpha', 'sitc1', 'sitc2', 'value']

// read list of files
console.log('Reading files...');
fs.readdir(srcDir)
  .then(files => Promise.all(files.map((filename) => {
    // if file extension is txt then read file & split by lines
    if (path.extname(filename) !== '.txt') return null;
    return fs.readFile(path.join(srcDir, filename))
      .then(filecontent => filecontent.toString().split('\n'))
      .then(rows => Promise.all(rows.map((row, index) => {

        // Extract CSV record
        if (!row) return null;
        const matches = row.match(rowRegex);
        if (!matches) throw new Error(`Row numner ${index}: "${row}" in file ${filename} did not match regex`);
        const [, qtrno, year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, value, mass]
          = matches.map(v => v.trim());
        // Each csv quarterly record should be added to six yearly records:
        // year, flow, nuts1, codalpha, sitc1, sitc2
        // y     y     y      y         y      y      <--- original data point
        // y     y     y      y         y      null   <--- total of sitc1
        // y     y     y      y         null   null   <--- total trade between reporter and partner
        // y     y     y      null      null   null   <--- total trade of reporter
        // y     y     y      null      y      null   <--- total trade of reporter by sitc1
        // y     y     y      null      y      y      <--- total trade of reporter by sitc2
        const masks = [
          {},
          { sitc2: 'null' },
          { sitc1: 'null', sitc2: 'null' },
          { codalpha: 'null', sitc1: 'null', sitc2: 'null' },
          { codalpha: 'null', sitc2: 'null' },
          { codalpha: 'null' }
        ];
        masks.forEach((mask) => {
          const record = Object.assign({
            year, flow, nuts1, codalpha, sitc1, sitc2, value: 0
          }, mask);
          const hash = `${record.year}_${record.flow}_${record.nuts1}_${record.codalpha}_${record.sitc1}_${record.sitc2}`;
          // if we don't have one this record yet, then initialize it
          if (!data.byHash[hash]) {
            data.byHash[hash] = record;
          }
          // add total to record by hash
          data.byHash[hash].value += parseInt(value, 10);
        });
      })));
  })))
  .then(() => {
    console.log('Finished processing rows and computing totals, sorting into buckets');
    Object.keys(data.byHash).forEach((hash) => {
      const record = data.byHash[hash];
      // Sort data into byReporterYear
      // TODO not all data goes into all buckets
      const yearKey = `${record.nuts1}_${record.year}`;
      if (!data.byReporterYear[yearKey]) data.byReporterYear[yearKey] = [];
      data.byReporterYear[yearKey].push(record);

      // Sort data into byReporterSitc
      if (record.sitc1 !== null) {
        const nuts1Sitc1Key = `${record.nuts1}_${record.sitc1}`;
        if (!data.byReporterSitc[nuts1Sitc1Key]) data.byReporterSitc[nuts1Sitc1Key] = [];
        data.byReporterSitc[nuts1Sitc1Key].push(record);
      }
      if (record.sitc2 !== null) {
        const nuts1Sitc2Key = `${record.nuts1}_${record.sitc2}`;
        if (!data.byReporterSitc[nuts1Sitc2Key]) data.byReporterSitc[nuts1Sitc2Key] = [];
        data.byReporterSitc[nuts1Sitc2Key].push(record);
      }
    });
  })
  .then(() => {
    console.log('Finished sorting.');
    // Write output to files for byReporterYear
    console.log(`Writing out ${Object.keys(data.byReporterYear).length} repoter_year buckets:`);
    return Promise.all(Object.keys(data.byReporterYear).map((key) => {
      const destFile = path.join(destDirByReporterYear, `${key}.csv`);
      console.log(`   ${destFile}`);
      return fs.outputFile(destFile, toCsv(data.byReporterYear[key], outputFields));
    }));
  })
  .then(() => {
    // Write output to files for byReporterSitc
    console.log(`Writing out ${Object.keys(data.byReporterSitc).length} reporter_sitc buckets:`);
    return Promise.all(Object.keys(data.byReporterSitc).map((key) => {
      const destFile = path.join(destDirByReporterSitc, `${key}.csv`);
      console.log(`   ${destFile}`);
      return fs.outputFile(destFile, toCsv(data.byReporterSitc[key], outputFields));
    }));
  })
  .then(() => console.log('All done!'));



function toCsv(collection, fields) {
  let output = fields.join(',');
  output += '\n';
  output += collection.reduce((out, record) => {
    out += fields.map(field => record[field]).join(',');
    out += '\n';
    return out;
  }, '');
  return output;
}