/* global window document */
/* eslint no-restricted-syntax: 0 */
/*
 * THIS FILE MANAGES API QUERIES AND CROSSFILTER SETUP
 * */

import * as d3 from 'd3';
import $ from 'jquery';
import crossfilter from 'crossfilter';

// data files
import reporters from '../../data/reporters.json';
import partners from '../../data/partners.json';
import years from '../../data/years.json';
import commodities from '../../data/commodities.json';
import worldJson from '../../data/world-110m.json';

// privates

// config
const baseQueryUrl = '/api';
const queryHistory = [];
const runningQueries = {};

// xfilter
const xFilter = crossfilter();
const xFilterByReporter = xFilter.dimension(d => d.reporter);
const xFilterByPartner = xFilter.dimension(d => d.partner);
const xFilterByYear = xFilter.dimension(d => +d.year);
const xFilterByCommodity = xFilter.dimension(d => d.commodity);
const xFilterByImportValue = xFilter.dimension(d => +d.importValue);

// private utility methods
const buildUrl = (filters) => {
  let requestUrl = `${baseQueryUrl}/${filters.reporter}`;
  requestUrl += (filters.partner !== null) ? `/${filters.partner}` : '/all';
  requestUrl += `/${filters.year}`;
  requestUrl += (filters.commodity !== null) ? `/${filters.commodity}` : '/all';
  requestUrl += '/data.csv';
  return requestUrl;
};

const equals = (a, b) => {
  const props = ['year', 'reporter', 'partner', 'commodity', 'importVal', 'exportVal', 'bilateralVal', 'balanceVal', 'importRank', 'exportRank', 'importPc', 'exportPc'];
  for (const prop of props) {
    if (a[prop] !== b[prop]) return false;
  }
  return true;
};

/*
 * Get a dataset for display
 * filters argument should be an object in the following form:
 * {
 *   reporter: 'NI',    // Reporter code
 *   partner:  'IT',    // Partner code or 'all'
 *   year:     'all',   // Specific year or 'all'
 *   commodity: '72'    // SITC1 or 2 code OR 'all'
 * }
 * limit will be used to return the top x number of records
 */
const getData = (filters, limit) => {
  // Clear all filters on the xFilter
  xFilterByReporter.filterAll();
  xFilterByPartner.filterAll();
  xFilterByYear.filterAll();
  xFilterByCommodity.filterAll();
  xFilterByImportValue.filterAll();

  // Add filteexporteach dimension
  if (typeof filters.reporter === 'undefined' || typeof filters.year === 'undefined') throw new Error('reporter and year must be defined when calling getData');
  xFilterByReporter.filter(filters.reporter);
  xFilterByYear.filter(+filters.year);
  xFilterByPartner.filter((filters.partner !== null) ? filters.partner : 'all');
  xFilterByCommodity.filter((filters.commodity !== null) ? filters.commodity : 'all');

  // Get the data from xFilter
  const lim = limit || Infinity;
  const newData = xFilterByImportValue.top(lim);

  // Return resulting records
  return newData;
};

const addData = (csvData, filters) => {
  const newData = d3.csvParse(csvData).map((record) => {
    const newRecord = Object.assign({}, record);
    newRecord.importVal = +record.importVal * 1000;
    newRecord.exportVal = +record.exportVal * 1000;
    return newRecord;
  });
  const existingData = getData(filters);
  const dedupedData = newData
    .filter(newRec => existingData.reduce(existingRec => !equals(existingRec, newRec), true));
  xFilter.add(dedupedData);

  console.groupCollapsed('API QUERY SUCCESS from %s', filters.initiator);
  console.log('filters: %o', filters);
  console.log(
    'Added %d new records. Retrieved %d records. Checked %d possible matches and discarded %d duplicates. New xFilter size: %d',
    dedupedData.length, newData.length, existingData.length,
    newData.length - dedupedData.length, xFilter.size()
  );
  console.groupEnd();
};

const fireQueryQueueUpdateEvent = () => {
  const event = document.createEvent('Events');
  event.initEvent('queryQueueUpdate', true, true);
  event.queryCount = Object.keys(runningQueries).length;
  window.dispatchEvent(event);
};

// exported object
const data = {

  // data arrays for select2 & choropleth
  reporters,
  partners,
  commodities,
  years,
  worldJson,

  // lookup hashes/maps
  reportersMap: d3.map(reporters, d => d.id),
  partnersMap: d3.map(partners, d => d.id),
  partnersByMapNumericalMap: d3.map(partners, d => d.mapNumerical),
  commoditiesMap: d3.map(commodities, d => d.id),

  getData,

  // lookup function with error handling
  lookup: (lookupVal, mapName, propertyName) => {
    try {
      return data[`${mapName}Map`].get(lookupVal)[propertyName];
    } catch (err) {
      console.warn(`There was a problem looking up ${lookupVal} in ${mapName}.${propertyName}: ${err}`);
      return 'unknown';
    }
  },

  /*
   * Run an API query
   * filters argument should be an object in the following form:
   * {
   *   reporter: 'NI',    // Reporter code (NUTS1)
   *   partner:  'IT',    // Partner code (codalpha or labarea) or 'all'
   *   year:     'all',   // Specific year or 'all'
   *   commodity: '34'    // SITC1 or 2 code OR 'all'
   * }
   * Callback is called with callback(error, ready)
   * ready will be true if new data was received and added to crossfilter or false otherwise.
   */
  query(filters, callback) {
    // Build URL & check if it has already been run or if it's presently running
    const requestUrl = buildUrl(filters);
    const isQueryCompleted = queryHistory.indexOf(requestUrl) > -1;
    const isQueryRunning = Object.keys(runningQueries).indexOf(requestUrl) > -1;
    if (isQueryCompleted) return callback();
    if (isQueryRunning) return runningQueries[requestUrl].push(callback);
    runningQueries[requestUrl] = [callback];
    fireQueryQueueUpdateEvent();

    // Make the ajax call
    $.ajax({
      url: requestUrl,
      timeout: 75000,
      beforeSend(xhr) {
        $('#loadingDiv #cancelRequest').on('click', () => {
          xhr.abort();
          $('#loadingDiv').fadeOut();
        });
        $('#loadingDiv').fadeIn();
      },
      success(result) {
        // Add data to crossfilter, the query to the history
        addData(result, filters);
        queryHistory.push(requestUrl);
      },
      error(xhr, status, err) {
        console.log('Unknown API error');
        runningQueries[requestUrl].forEach(cb => cb(`${status} ${err} ${xhr.responseText}`));
      },
      complete() {
        runningQueries[requestUrl].forEach(cb => cb());
        delete runningQueries[requestUrl];
        fireQueryQueueUpdateEvent();
        // If finished then hide the loadingDiv
        if (Object.keys(runningQueries).length === 0) {
          $('#loadingDiv').fadeOut();
          $('#loadingDiv #cancelRequest').off('click');
        }
      }
    });
    return null;
  }

};

export default data;
