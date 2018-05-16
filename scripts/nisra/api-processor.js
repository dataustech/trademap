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

// libraries
const fs = require('fs-extra');
const path = require('path');

// helpers
const { toCsv, extractRows, addRecordToData, computeRanksAndPercentages } = require('./helpers');

// data_dictionaries
const reporters = require('../../src/nisra/data/reporters.json');
const partners = require('../../src/nisra/data/partners.json');
const commodities = require('../../src/nisra/data/commodities.json');
const years = require('../../src/nisra/data/years.json');

const sitc1codes = Object.keys(commodities).filter(key => commodities[key].type === 'sitc1');
const sitc2codes = Object.keys(commodities).filter(key => commodities[key].type === 'sitc2');
const labareacodes = Object.keys(partners).filter(key => partners[key].type === 'labarea');
const codalphacodes = Object.keys(partners).filter(key => partners[key].type === 'codalpha');

// config
const srcDir = path.join(__dirname, '../../src/nisra/api');
const destDir = path.join(__dirname, '../../dist/nisra/api');
const outputFields = ['year', 'reporter', 'partner', 'commodity', 'importVal', 'exportVal', 'bilateralVal', 'balanceVal', 'importRank', 'exportRank', 'importPc', 'exportPc'];

// data structure preparation
console.log('Preparing data structure');
partners.all = {};
commodities.all = {};
years.push('all');
const data = {};
Object.keys(reporters).forEach((reporter) => {
  data[reporter] = {};
  Object.keys(partners).forEach((partner) => {
    data[reporter][partner] = {};
    years.forEach((year) => {
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
    console.log(`Aggregated ${yearlyRecords.length} yearly records.`);
    yearlyRecords.forEach(record => addRecordToData(record, data));
  })

  // Compute percentages and rankings
  .then(() => {
    console.log('Computing percentages and rankings');
    // data[reporter][partner][year][commodity]

    // totals to compute:
    // rep->labarea->y->comm % & rank compared to all labareas
    // rep->codalpha->y->comm % & rank compared to all codalphas
    // rep->labarea->y->allcomm % & rank compared to all labareas
    // rep->codalpha->y->allcomm % & rank compared to all codalphas

    // loop over years
    //   loop over reporters
    //     loop over labareas
    //       get, sort & compute totals for rep->labarea->year->all SITC1s
    //       get, sort & compute totals for rep->labarea->year->all SITC2s
    //       loop over lists & go set % & rank
    //     loop over codalphas
    //       get, sort & compute totals for rep->codalpha->year->all SITC1s
    //       get, sort & compute totals for rep->codalpha->year->all SITC2s
    //       loop over lists & go set % & rank

    years.forEach((year) => {
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
    console.log('Finished computing and sorting. Writing out files.');
    Object.keys(data).forEach((reporter) => {
      Object.keys(data[reporter]).forEach((partner) => {
        Object.keys(data[reporter][partner]).forEach((year) => {
          Object.keys(data[reporter][partner][year]).forEach((commodity) => {
            const values = Object.values(data[reporter][partner][year][commodity]);
            if (values && values.length > 0) {
              const destFile = path.join(destDir, `${reporter}/${partner}/${year}/${commodity}/data.csv`);
              // console.log(`Writing out ${values.length} rows to ${destFile}`);
              fs.outputFileSync(destFile, toCsv(values, outputFields));
            }
          });
        });
      });
    });
  })
  .then(() => console.log('All done!'));
