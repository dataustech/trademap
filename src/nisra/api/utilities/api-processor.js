/*
 See README.md in src/nisra for details
 */

/* eslint dot-notation: 0 */
/* eslint max-len: 0 */
/* eslint no-lonely-if: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-shadow: 0 */
/* eslint no-unused-vars: 0 */
/* eslint object-curly-newline: 0 */
/* eslint prefer-const: 0 */
/* eslint import/no-extraneous-dependencies: 0 */

// libraries
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');

// helpers
const { toCsv, extractRows, addRecordToData, computeRanksAndPercentages, printProgress } = require('./helpers');

// data_dictionaries
const reducer = (map, option) => {
  map[option.id] = option;
  return map;
}
const reporters = require('../../data/reporters.json').reduce(reducer, {});
const partners = require('../../data/partners.json').reduce(reducer, {});
const commodities = require('../../data/commodities.json').reduce(reducer, {});
const years = require('../../data/years.json').reduce(reducer, {});


const sitc1codes = Object.keys(commodities).filter(key => commodities[key].type === 'sitc1');
const sitc2codes = Object.keys(commodities).filter(key => commodities[key].type === 'sitc2');
const labareacodes = Object.keys(partners).filter(key => partners[key].type === 'labarea');
const codalphacodes = Object.keys(partners).filter(key => partners[key].type === 'codalpha');

// config
const srcDir = path.join(__dirname, '../');
const destDir = path.join(__dirname, '../../../../dist/nisra/api');
const outputFields = ['year', 'reporter', 'partner', 'commodity', 'importVal', 'exportVal', 'bilateralVal', 'balanceVal', 'importRank', 'exportRank', 'importPc', 'exportPc'];

// data structure preparation
console.log('Preparing data structure');
partners.all = {};
commodities.all = {};
years['all'] = {
  id: 'all', text: 'all'
};
const data = {};
Object.keys(reporters).forEach((reporter) => {
  data[reporter] = {};
  Object.keys(partners).forEach((partner) => {
    data[reporter][partner] = {};
    Object.keys(years).forEach((year) => {
      data[reporter][partner][year] = {};
      Object.keys(commodities).forEach((commodity) => {
        data[reporter][partner][year][commodity] = {}; // will be keyed by hash to properly sum
      });
    });
  });
});

// data structure:
// data[reporter][partner][year][commodity]

// Read directory listing
console.log('Reading directory lising');
fs.readdir(srcDir)

  // Filter to only .txt files & read from each file & extract valid rows as objects
  .then(directoryListing => directoryListing.filter(filename => path.extname(filename) === '.txt'))
  .then(txtFilenames => Promise.all(txtFilenames.map(filename => fs.readFile(path.join(srcDir, filename)))))
  .then(fileContents => Promise.all(fileContents.map(fileContent => fileContent.toString().split('\n'))))
  .then(rowsByFile => rowsByFile.reduce((flat, toFlatten) => flat.concat(toFlatten), []))
  .then(txtRows => extractRows(txtRows))

  // Combine quarterly data into yearly data & combine flow values
  .then((quarterlyRecords) => {
    console.log(`Selected ${quarterlyRecords.length} for processing. Consolidating quarterly data into yearly data`);

    const yearlyRecords = quarterlyRecords.reduce((yearlyData, rowRecord) => {
      const { quarter, year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, value, mass } = rowRecord;
      const hash = `${year}_${nuts1}_${codalpha}_${sitc2}`;
      if (!yearlyData[hash]) {
        yearlyData[hash] = { year, nuts1, labarea, codalpha, sitc1, sitc2, importVal: 0, exportVal: 0, balanceVal: 0, bilateralVal: 0 };
      }
      if (flow === 'I') {
        yearlyData[hash].importVal += value;
      }
      if (flow === 'E') {
        yearlyData[hash].exportVal += value;
      }
      yearlyData[hash].balanceVal = yearlyData[hash].exportVal - yearlyData[hash].importVal;
      yearlyData[hash].bilateralVal = yearlyData[hash].exportVal + yearlyData[hash].importVal;
      return yearlyData;
    }, {});

    return Object.values(yearlyRecords);
  })

  // Add rows to individual aggregate levels & add to data structure
  .then((yearlyRecords) => {
    console.log(`Aggregated ${yearlyRecords.length} yearly records, creating aggregated records.`);
    yearlyRecords.forEach(record => addRecordToData(record, data));
  })

  // Compute percentages and rankings
  .then(() => {
    console.log('Computing percentages and rankings');

    Object.keys(years).forEach((year) => {
      Object.keys(reporters).forEach((reporter) => {
        labareacodes.forEach((labarea) => {
          computeRanksAndPercentages(data[reporter][labarea][year]['all'], 'sitc1');
          computeRanksAndPercentages(data[reporter][labarea][year]['all'], 'sitc2');
        });
        codalphacodes.forEach((codalpha) => {
          computeRanksAndPercentages(data[reporter][codalpha][year]['all'], 'sitc1');
          computeRanksAndPercentages(data[reporter][codalpha][year]['all'], 'sitc2');
        });
      });
    });
  })

  // Write output to files for byReporterYear
  .then(() => {
    console.log('Finished computing and sorting. Getting list of files to write.');
    const dataPaths = [];
    Object.keys(data).forEach((reporter) => {
      Object.keys(data[reporter]).forEach((partner) => {
        Object.keys(data[reporter][partner]).forEach((year) => {
          Object.keys(data[reporter][partner][year]).forEach((commodity) => {
            dataPaths.push({ reporter, partner, year, commodity });
          });
        });
      });
    });
    const totalFiles = dataPaths.length;
    let filesWritten = 0;
    console.log(`${totalFiles} files need to be written`);
    return Promise.map(
      dataPaths,
      (d) => {
        filesWritten++;
        const { reporter, partner, year, commodity } = d;
        const values = Object.values(data[reporter][partner][year][commodity]);
        if (!values) return null;
        const destFile = path.join(destDir, `${reporter}/${partner}/${year}/${commodity}/data.csv`);
        printProgress(`Writing file ${filesWritten} of ${totalFiles}`);
        return fs.outputFile(destFile, toCsv(values, outputFields));
      },
      { concurrency: 10 }
    );
  })
  .then(() => console.log('All done!'));
