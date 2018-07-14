/* eslint dot-notation: 0 */
/* eslint max-len: 0 */
/* eslint no-lonely-if: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-shadow: 0 */
/* eslint no-unused-vars: 0 */
/* eslint object-curly-newline: 0 */
/* eslint prefer-const: 0 */
/* eslint no-multi-spaces: 0 */

// data_dictionaries
const reducer = (map, option) => {
  map[option.id] = option;
  return map;
};
const reporters = require('../../data/reporters.json').reduce(reducer, {});
const partners = require('../../data/partners.json').reduce(reducer, {});
const commodities = require('../../data/commodities.json').reduce(reducer, {});
const years = require('../../data/years.json').reduce(reducer, {});

const codalphaBlacklist = ['#1', '#2', '#3', '#4', '#5', '#6', '#7', 'QS', 'QR'];
const rowRegex = /^([1-4])Q(\d{4})([IE])([A-Z]{2})([A-J])([A-Z0-9 ]{3})([A-Z0-9#]{2})(\d)(\d{2})([ 0-9]{9})([ 0-9]{9})/;

function toCsv(collection, fields) {
  if (!collection.length) throw new Error('toCsv called with empty collection');
  let output = fields.join(',');
  output += '\n';
  output += collection.reduce((out, record) => {
    out += fields.map(field => record[field]).join(',');
    out += '\n';
    return out;
  }, '');
  return output;
}

function validateRowRecord(record) {
  const { year, nuts1, labarea, codalpha } = record;
  if (!years[parseInt(year, 10)]) throw new Error(`Invalid year used in record: ${year}`);
  if (!reporters[nuts1]) throw new Error(`Invalid reporter used in record: ${nuts1}`);
  if (!partners[labarea]) throw new Error(`Invalid labarea used in record: ${labarea}`);
  if (!partners[codalpha]) throw new Error(`Invalid codalpha used in record: ${codalpha}`);
}

function shouldIgnore(record) {
  return codalphaBlacklist.indexOf(record.codalpha) >= 0;
}

function extractRows(txtRows) {
  return txtRows.reduce((toProcess, row) => {
    // Extract each row
    if (!row) return toProcess;
    const matches = row.match(rowRegex);
    if (!matches) throw new Error(`Row "${row}" did not match regex`);
    let [, quarter, year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, value, mass] = matches.map(v => v.trim());
    value = parseInt(value, 10);
    mass = parseInt(mass, 10);
    const rowRecord = { quarter, year, flow, nuts1, labarea, codseq, codalpha, sitc1, sitc2, value, mass };
    // Skip row if should be ignored
    if (shouldIgnore(rowRecord)) return toProcess;
    // Validate values (will throw errors and stop execution if it does not validate)
    validateRowRecord(rowRecord);
    toProcess.push(rowRecord);
    return toProcess;
  }, []);
}

function makeHash(record) {
  if (typeof record.commodity !== 'string') throw new Error('commodity code is not a string');
  if (record.commodityType === 'sitc1' && record.commodity.length !== 1) throw new Error('sitc1 not one digit long');
  if (record.commodityType === 'sitc2' && record.commodity.length !== 2) throw new Error('sitc2 not two digit long');
  return `${record.year}_${record.reporter}_${record.partner}_${record.partnerType}_${record.commodity}_${record.commodityType}`;
}

function addRecord(record, hashMap) {
  const hash = makeHash(record);
  if (!hashMap[hash]) {
    hashMap[hash] = { ...record };
    hashMap[hash].aggregated = 1;
  } else {
    hashMap[hash].importVal += record.importVal;
    hashMap[hash].exportVal += record.exportVal;
    hashMap[hash].balanceVal = hashMap[hash].exportVal - hashMap[hash].importVal;
    hashMap[hash].bilateralVal = hashMap[hash].exportVal + hashMap[hash].importVal;
    hashMap[hash].aggregated += 1;
  }
}

function addRecordToData(yearlyRecord, data) {
  const { year, nuts1: reporter, labarea, codalpha, sitc1, sitc2, importVal, exportVal, bilateralVal, balanceVal } = yearlyRecord;

  // for each yearly record we generate 9 records for different aggregation levels
  const aggregationRecords = [
    // by sitc1/sitc2 and labarea/codalpha
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc1, commodityType: 'sitc1', partnerType: 'codealpha', partner: codalpha }, // 1
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc1, commodityType: 'sitc1', partnerType: 'labarea',   partner: labarea  }, // 2
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc2, commodityType: 'sitc2', partnerType: 'codealpha', partner: codalpha }, // 3
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc2, commodityType: 'sitc2', partnerType: 'labarea',   partner: labarea  }, // 4
    // for commodity = all by labarea/codalpha
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: 'all', commodityType: 'all',   partnerType: 'codealpha', partner: codalpha }, // 5
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: 'all', commodityType: 'all',   partnerType: 'labarea',   partner: labarea  }, // 6
    // for partner = all by sitc1/sitc2
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc2, commodityType: 'sitc2', partnerType: 'all',       partner: 'all'    }, // 7
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: sitc1, commodityType: 'sitc1', partnerType: 'all',       partner: 'all'    }, // 8
    // for partner = all and commodity = all
    { year, importVal, exportVal, bilateralVal, balanceVal, reporter, commodity: 'all', commodityType: 'all',   partnerType: 'all',       partner: 'all'    }, // 9
  ];

  // then each record is added to different parts of the data hash reflecting which file paths it should be output to
  aggregationRecords.forEach((record) => {
    const { reporter, partner, year, commodity } = record;
    if (partner !== 'all') {
      if (commodity !== 'all') {
        // case 1 commodity != all & partner != all (#1-4)
        addRecord(record, data[reporter][partner][year][commodity]);
        addRecord(record, data[reporter][partner][year]['all']);
        addRecord(record, data[reporter][partner]['all'][commodity]);
        addRecord(record, data[reporter][partner]['all']['all']);
        addRecord(record, data[reporter]['all'][year][commodity]);
        addRecord(record, data[reporter]['all'][year]['all']);
        addRecord(record, data[reporter]['all']['all'][commodity]);
        addRecord(record, data[reporter]['all']['all']['all']);
      } else {
        // case 2 !commodity = all & partner != all (#5-6)
        addRecord(record, data[reporter][partner][year]['all']);
        addRecord(record, data[reporter][partner]['all']['all']);
        addRecord(record, data[reporter]['all'][year]['all']);
        addRecord(record, data[reporter]['all']['all']['all']);
      }
    } else {
      if (commodity !== 'all') {
        // case 3 commodity != all & partner = all (#7-8)
        addRecord(record, data[reporter]['all'][year][commodity]);
        addRecord(record, data[reporter]['all']['all'][commodity]);
        addRecord(record, data[reporter]['all'][year]['all']);
        addRecord(record, data[reporter]['all']['all']['all']);
      } else {
        // case 4 commodity = all & partner = all (#9)
        addRecord(record, data[reporter]['all'][year]['all']);
        addRecord(record, data[reporter]['all']['all']['all']);
      }
    }
  });
}

function computeRanksAndPercentages(records, commodityType) {
  // get rep->labarea->year->all SITC1s
  let totalImport = 0;
  let totalExport = 0;
  Object.values(records)
    // only include sitc1 records and capture total values
    .filter((r) => {
      if (r.commodityType === commodityType) {
        return true;
      }
      if (r.commodityType === 'all') {
        totalExport = r.exportVal;
        totalImport = r.importVal;
      }
      return false;
    })
    // sort descending by importval & set rank and %
    .sort((a, b) => b.importVal - a.importVal)
    .map((r, i) => {
      r.importRank = i;
      r.importPc = (r.importVal / totalImport).toFixed(2);
      return r;
    })
    // sort descending by exportval & set rank and %
    .sort((a, b) => b.exportVal - a.exportVal)
    .map((r, i) => {
      r.exportRank = i;
      r.exportPc = (r.exportVal / totalExport).toFixed(2);
      return r;
    });
}

function printProgress(message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
}

module.exports = { toCsv, extractRows, addRecordToData, computeRanksAndPercentages, printProgress };
