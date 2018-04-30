/* eslint max-len: 0 */
const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, 'src/nisra/api');
const destDirByYear = path.join(__dirname, 'dist/nisra/api/byYear');
const destDirByReporterSitc = path.join(__dirname, 'dist/nisra/api/byReporterSitc');
const rowRegex = /^([1-4])Q(\d{4})([IE])([A-Z]{2})([A-J])([A-Z0-9 ]{3})([A-Z0-9#]{2})(\d)(\d{2})([ 0-9]{9})([ 0-9]{9})/;
const data = {
  byHash: {},
  byYear: {},
  byReporterSitc: {}
};

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
          { sitc2: null },
          { sitc1: null, sitc2: null },
          { codalpha: null, sitc1: null, sitc2: null },
          { codalpha: null, sitc2: null },
          { codalpha: null }
        ];
        masks.forEach((mask) => {
          const record = Object.assign(mask, {
            year, flow, nuts1, codalpha, sitc1, sitc2, value: 0
          });
          const hash = `${record.year}_${record.flow}_${record.nuts1}_${record.codalpha}_${record.sitc1}_${record.sitc2}`;
          if (!data.byHash[hash]) {
            data.byHash[hash] = record;
          }
          // add to total
          data.byHash[hash].value += parseInt(value, 10);
        });
      })));
  })))
  .then(() => {
    console.log('Finished processing rows and computing totals, sorting into buckets');
    Object.keys(data.byHash).forEach((hash) => {
      const record = data.byHash[hash];
      // Sort data into byYear
      if (!data.byYear[record.year]) data.byYear[record.year] = [];
      data.byYear[record.year].push(record);

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
    // Write output to files for byYear
    console.log(`Writing out ${Object.keys(data.byYear).length} year buckets:`);
    return Promise.all(Object.keys(data.byYear).map((year) => {
      const destFile = path.join(destDirByYear, `${year}.csv`);
      console.log(destFile);
      return fs.outputFile(destFile, toCsv(data.byYear[year]));
    }));
  })
  .then(() => {
    // Write output to files for byReporterSitc
    console.log(`Writing out ${Object.keys(data.byReporterSitc).length} reporter_sitc buckets:`);
    return Promise.all(Object.keys(data.byReporterSitc).map((key) => {
      const destFile = path.join(destDirByReporterSitc, `${key}.csv`);
      console.log(destFile);
      return fs.outputFile(destFile, toCsv(data.byReporterSitc[key]));
    }));
  })
  .then(() => console.log('All done!'));




// qtrno $ 1-6
// flow $ 7         ---> import or export (I or E)
// nuts1 $ 8-9
// labarea $ 10     ---> 1 letter world region
// codseq $ 11-13   ---> 3 char numerical coding of partner country (currently ignored)
// codalpha $ 14-15 ---> 2 letter country code or #n region code
// sitc1 $16  (SITC Section – 1-digit)
// sitc2 $17-18  (SITC Division – 2-digit)
// value 19-27
// mass 28-36

// 3Q2017EEAAA  #1001     2025     1805
// 3Q2017EEAAA  #1002        1        2
// 3Q2017EEAAA  #1004      189      269
// 3Q2017EEAAA  #1005       28       23
// 3Q2017EEAAA  #1006       11        1
// 3Q2017EEAAA  #1007      123       39
// 3Q2017EEAAA  #1008       92       93
// 3Q2017EEAAA  #1009       76       28
// 3Q2017EEAAA  #1111      109       42
// 3Q2017EEAAA  #1226        1        0
// 3Q2017EEAAA  #1227        1        1
// 3Q2017EEAAA  #1333        2        0
// 3Q2017EEAAA  #1442        0        0
// 3Q2017EEAAA  #1443       12        1
// 3Q2017EEAAA  #1551      210       17
// 3Q2017EEAAA  #1552        0        0
// 3Q2017EEAAA  #1553      337       67
// 3Q2017EEAAA  #1554     2090       40
// 3Q2017EEAAA  #1555      833      365
// 3Q2017EEAAA  #1556       78       34
// 3Q2017EEAAA  #1557        1        0
// 3Q2017EEAAA  #1558      517       88
// 3Q2017EEAAA  #1559      635       89
// 3Q2017EEAAA  #1661       41        1
// 3Q2017EEAAA  #1662       38        3
// 3Q2017EEAAA  #1664      752       65
// 3Q2017EEAAA  #1665       43        0
// 3Q2017EEAAA  #1666       61       41
// 3Q2017EEAAA  #1667       21        3
// 3Q2017EEAAA  #1668       19        3
// 3Q2017EEAAA  #1669      119       38


function toCsv (collection, fields) {
    let output = fields.join(',');
    output += '\n';
    output += collection.reduce((out, record) => {
        fields.forEach(field => {
            out += record[field] + ',';
        });
        out += '\n;'
    },'');
}