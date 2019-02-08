/* global window */

/*
 * THIS FILE SETS UP THE topExportCommodities chart
 * */
import $ from 'jquery';
import * as d3 from 'd3';

import data from '../data';
import rowchart from '../rowchart';
import gui from '../gui';

const $container = $('#topExportCommodities');
const $commodityTypeButtons = $('#topExportCommodities .commodityTypeButtons');
const $chart = $container.children('.chart');
const $chartTitle = $container.children('.chartTitle');

const height = $chart.height();
const width = $chart.width();
const svg = d3.select('#topExportCommodities .chart')
  .append('svg')
  .attr('xmlns', 'http://www.w3.org/2000/svg')
  .attr('version', 1.1)
  .classed('svgChart', true)
  .attr('height', height)
  .attr('width', width);
const numEntries = 10;

const chart = {

  currentFilters: {
    commodityType: 'sitc1'
  },

  setup() {
    // Bind the refresh function to the refreshFilters event
    $chart.on('refreshFilters', chart.refresh);
    // Bind the resize function to the window resize event
    $(window).on('resize', () => {
      rowchart.resizeSvg(svg, $chart.width(), 'exportVal');
    });
    // Add behaviours to selectors for commodityType
    $commodityTypeButtons.on('click', (event) => {
      $commodityTypeButtons.find('button').removeClass('btn-primary').addClass('btn-default');
      $(event.target).closest('button').removeClass('btn-default').addClass('btn-primary');
      const commodityType = $commodityTypeButtons.find('.btn-primary').attr('data-value');
      this.refresh(event, Object.assign({}, chart.currentFilters, { commodityType }));
    });
    // Setup the svg
    rowchart.setup(svg);
    // Hide on load
    $container.slideUp(0);
  },

  refresh(event, filters) {
    chart.currentFilters = Object.assign({}, chart.currentFilters, filters);
    const { reporter, partner, commodity, year, commodityType } = chart.currentFilters;

    // CASE 1: reporter = null
    // CASE 4: commodity = selected    partner = selected
    // CASE 5: commodity = selected    partner = null
    if (
      reporter === null ||
      typeof reporter === 'undefined' ||
      commodity !== null
    ) return $container.slideUp();

    // We build queryFilter & dataFilter objects to make API queries more generic than data queries
    const queryFilter = {
      reporter,
      initiator: 'topExportCommodities'
    };
    const dataFilter = {
      reporter,
      year,
      commodityType,
      initiator: 'topExportCommodities'
    };
    let title = '';

    if (partner === null) {
      // CASE 2: commodity = null        partner = null
      title = `${data.lookup(reporter, 'reporters', 'text')} - Top-10 exports to the world in ${year}`;
      dataFilter.partner = 'all';
    } else {
      // CASE 3: commodity = null        partner = selected
      title = `${data.lookup(reporter, 'reporters', 'text')} - Top-10 exports to ${data.lookup(partner, 'partners', 'text')} in ${year}`;
      dataFilter.partner = partner;
      dataFilter.partnerType = data.lookup(partner, 'partners', 'type');
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
        rowchart.draw(svg, newData, chart.colors[0][1], 'exportVal', 'commodity');
      });
    });
  }
};

export default chart;
