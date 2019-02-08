/* global window */

/*
 * THIS FILE SETS UP THE topExportMarkets chart
 * */
import $ from 'jquery';
import * as d3 from 'd3';

import data from '../data';
import rowchart from '../rowchart';
import gui from '../gui';

const $container = $('#topExportMarkets');
const $partnerTypeButtons = $('#topExportMarkets .partnerTypeButtons');
const $chart = $container.children('.chart');
const $chartTitle = $container.children('.chartTitle');

const height = $chart.height();
const width = $chart.width();
const svg = d3.select('#topExportMarkets .chart')
  .append('svg')
  .attr('xmlns', 'http://www.w3.org/2000/svg')
  .attr('version', 1.1)
  .classed('svgChart', true)
  .attr('height', height)
  .attr('width', width);
const numEntries = 10;

const chart = {

  currentFilters: {
    partnerType: 'codealpha'
  },

  setup() {
    // Bind the refresh function to the refreshFilters event
    $chart.on('refreshFilters', chart.refresh);
    // Bind the resize function to the window resize event
    $(window).on('resize', () => {
      rowchart.resizeSvg(svg, $chart.width(), 'exportVal');
    });
    // Add behaviours to selectors for partnerType
    $partnerTypeButtons.on('click', (event) => {
      $partnerTypeButtons.find('button').removeClass('btn-primary').addClass('btn-default');
      $(event.target).closest('button').removeClass('btn-default').addClass('btn-primary');
      const partnerType = $partnerTypeButtons.find('.btn-primary').attr('data-value');
      this.refresh(event, Object.assign({}, chart.currentFilters, { partnerType }));
    });
    // Setup the svg
    rowchart.setup(svg);
    // Hide on load
    $container.slideUp(0);
  },

  refresh(event, filters) {
    chart.currentFilters = Object.assign({}, chart.currentFilters, filters);
    const { reporter, partner, commodity, year, partnerType } = chart.currentFilters;

    // CASE 1: reporter = null
    // CASE 3: commodity = null        partner = selected
    // CASE 4: commodity = selected    partner = selected
    if (
      reporter === null ||
      typeof reporter === 'undefined' ||
      partner !== null
    ) return $container.slideUp();

    // We build queryFilter & dataFilter objects to make API queries more generic than data queries
    const queryFilter = {
      reporter,
      initiator: 'topExportMarkets'
    };
    const dataFilter = {
      reporter,
      year,
      partnerType,
      initiator: 'topExportMarkets'
    };
    let title = '';

    if (commodity === null) {
      // CASE 2: commodity = null        partner = null
      title = `${data.lookup(reporter, 'reporters', 'text')} - Top-10 export markets in ${year}`;
      dataFilter.commodity = 'all';
    } else {
      // CASE 5: commodity = selected    partner = null
      // This is already covered by the data in CASE 2 so we don't specify the
      // commodity in the api query to avoid duplicate data and requests
      title = `${data.lookup(reporter, 'reporters', 'text')} - Top-10 export markets for ${data.lookup(commodity, 'commodities', 'text')} in ${year}`;
      dataFilter.commodity = commodity;
    }

    $chartTitle.html(title);

    return data.query(queryFilter, (err) => {
      if (err) { gui.showError(err); }

      const newData = data.getData(dataFilter, numEntries, 'export');

      // Set download link
      $container.find('.downloadData').unbind('click').on('click', (e) => {
        e.preventDefault();
        gui.downloadCsv(title, newData);
      });

      $container.slideDown(400, () => {
        rowchart.draw(svg, newData, chart.colors[0][1], 'exportVal', 'partner');
      });
    });
  }

};

export default chart;
