/* eslint max-len: 0 */
const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, 'src/nisra/api');
const rowRegex = /^([1-4])Q(\d{4})([IE])([A-Z]{2})([A-J])([A-Z0-9 ]{3})([A-Z0-9#]{2})(\d)(\d{2})([ 0-9]{9})([ 0-9]{9})/;
const data = {
  byHash: {},
  byYear: {},
  byReporterSitc: {}
};

// read list of files
fs.readdir(srcDir)
  .then(files => Promise.all(files.map((filename) => {
    // if file extension is txt then read file & split by lines
    if (path.extname(filename) !== '.txt') return null;
    console.log(`Reading file ${filename}`);
    return fs.readFile(path.join(srcDir, filename))
      .then(filecontent => filecontent.toString().split('\n'))
      .then(rows => Promise.all(rows.map((row, index) => {
        // console.log(`Processing row: ${row}`);
        if (!row) return null;
        const matches = row.match(rowRegex);
        if (!matches) throw new Error(`Row numner ${index}: "${row}" in file ${filename} did not match regex`);
        const [, qtrno, year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, value, mass]
          = matches.map(v => v.trim());
        const rowHash = `${year}${flow}${nuts1}${labarea}${codseq}${codalpha}${sitc1}${sitc2}`;
        // Add to data.byHash first the do the byYear and by reporter-sitc later
        if (!data.byHash[rowHash]) {
          data.byHash[rowHash] = {
            year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, values: {}, masses: {}, totalValue: 0, totalMass: 0
          };
        }
        data.byHash[rowHash].values[qtrno] = value;
        data.byHash[rowHash].masses[qtrno] = mass;
        data.byHash[rowHash].totalValue += value;
        data.byHash[rowHash].totalMass += mass;
        return null;
      })));
  })))
  .then(() => {
    console.log('Finished processing rows, computing totals');
    Object.keys(data.byHash).forEach((hash) => {
      if (Object.keys(data.byHash[hash].values).length !== 4) throw new Error(`${hash} did not have data for 4 quarters, only had data for: ${Object.keys(data.byHash[hash].values).join(', ')}`);
    });
    // TODO reduce quarters into years:
      // sum together totals for records where flow, nuts1,labarea,codeseq,codealpha,sitc1 & sitc2 match
    // TODO Aggregate and generate totals per year
    // TODO total by sitc1 (add row with sitc2=null)
    // TODO total by sitc2 (add row with sitc1=null)
  })
  .then(() => {
    // TODO write output to files
  });

// qtrno $ 1-6
// flow $ 7 (I or E)
// nuts1 $ 8-9
// labarea $ 10
// codseq $ 11-13
// codalpha $ 14-15
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
