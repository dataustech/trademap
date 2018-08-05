/* global document window */
/* eslint object-curly-newline: 0 */
/*
 * THIS FILE SETS UP THE information box
 * */
import $ from 'jquery';
import * as d3 from 'd3';

import data from '../data';
import gui from '../gui';
import { numFormat, numOrdinal } from '../utils';

const $infoBox = $('#infoBox');
const $defaultPanel = $('#defaultPanel');
const $hoverPanel = $('#hoverPanel');

const bottomMargin = 10;

const getPositionFromTop = () => {
  if ($(document).width() > 992) {
    return `${Math.min(
      $('#infoBoxPlaceholder').offset().top,
      $(window).height() - $infoBox.height() - bottomMargin + $(window).scrollTop()
    )}px`;
  }
  return $('#infoBoxPlaceholder').offset().top;
};

const getWidth = () => `${$('#infoBoxPlaceholder').width() - 20}px`;

const repositionBox = () => {
  $infoBox
    .css({
      top: getPositionFromTop(),
      width: getWidth()
    });
};

const box = {

  setup() {
    // Display and position the infoBox (which is otherwise hidden)
    $infoBox
      .show()
      .css({
        top: $(window).height() - $infoBox.height() - bottomMargin + $(window).scrollTop(),
        width: getWidth()
      });

    // Bind to the scroll event and move the box
    $(window).scroll(repositionBox);

    // Initialize the position of the hoverPanel
    $hoverPanel.slideUp();

    // Bind to window.resize for responsive behaviour
    $(window).on('resize', repositionBox);

    // Set a timeout and call a reposition to ensure positioning on first load
    setTimeout(repositionBox, 800);

    // Bind the refresh function to the refreshFilters event
    $infoBox.on('refreshFilters', box.refresh);
  },


  refresh(event, filters) {
    const { reporter, partner, commodity, year } = filters;

    // CASE 1: reporter = null
    if (
      reporter === null
    ) return $infoBox.slideUp();

    $infoBox.slideDown();

    // We build a queryFilter and a dataFilter object to make
    // API queries more generic than data queries
    const queryFilter = {
      reporter,
      // year,
      initiator: 'infoBox'
    };
    const dataFilter = {
      reporter,
      year,
      commodity: 'all'
    };

    // NOTE that we leave dataFilter.partner undefined when a partner is selected
    // rather than equal to 'all' or to the specific partner so that the returned
    // dataset will include also world as partner which we need for calculations.
    if (!partner) {
      dataFilter.partner = 'all';
    }

    // CASE 2: reporter = selected    commodity = null        partner = null

    // CASE 3: reporter = selected    commodity = null        partner = selected

    // CASE 4: reporter = selected    commodity = selected    partner = selected
    if (reporter && commodity && partner) {
      dataFilter.commodity = commodity;
    }

    // CASE 5: reporter = selected    commodity = selected    partner = null
    if (reporter && commodity && !partner) {
      dataFilter.commodity = commodity;
    }


    // Run query if necessary
    return data.query(queryFilter, (err) => {
      if (err) { gui.showError(err); }

      const newData = data.getData(dataFilter);
      const newDataByPartner = d3.map(newData, d => d.partner);
      box.populateBox($defaultPanel, newDataByPartner.get(partner || 0), partner);
    });
  },


  populateBox($panel, details, countryUnNum) {
    // Clear data previously in box
    $panel.find('.subtitle').html('');
    $panel.find('.value').html('');
    $panel.find('.ranking').html('');
    $panel.find('dt').show();

    // If no details then display no data and stop.
    if (!details) {
      $panel.find('.subtitle').html(`<p class="text-center"><strong>No data available for ${data.lookup(countryUnNum, 'partnersByMapNumerical', 'text')}.</strong></p>`);
      $panel.find('.value, .ranking').html('');
      $panel.find('dt').hide();
      return;
    }

    const reporterName = data.lookup(details.reporter, 'reporters', 'text');
    const partnerName = data.lookup(details.partner, 'partners', 'text');
    let subtitle = `<strong>${reporterName}</strong> trade in goods with <strong>${partnerName}</strong> in <strong>${details.year}</strong><br />`;
    if (details.commodity && details.commodity !== 'all') {
      subtitle += `<strong>${data.lookup(details.commodity, 'commodities', 'text')}</strong>`;
    }
    $panel.find('.subtitle').html(subtitle);

    // Populate panel
    $panel.find('.value.exports').html(numFormat(details.exportVal, null, 1));
    $panel.find('.value.imports').html(numFormat(details.importVal, null, 1));
    $panel.find('.value.balance').html(numFormat(details.balanceVal, null, 1));
    $panel.find('.value.bilateral').html(numFormat(details.bilateralVal, null, 1));

    // Show ranking only if partner and rankings are given
    if (details.partner && details.partner !== 0 && details.importRank && details.exportRank) {
      let ranking;
      try {
        ranking = [
          `${partnerName} was the ${numOrdinal(details.exportRank)} largest export market for ${reporterName} `,
          `(${details.exportPc.toFixed(1)}% of ${reporterName} exports) `,
          `and the ${numOrdinal(details.importRank)} largest import market for ${reporterName} `,
          `(${details.importPc.toFixed(1)}% of ${reporterName} imports)`
        ].join('');
      } catch (err) {
        ranking = [`${partnerName} was the ${numOrdinal(details.exportRank)} largest export market for ${reporterName} and the ${numOrdinal(details.importRank)} largest import market for ${reporterName}.`].join();
      }
      if (details.commodity && details.commodity !== 'all') {
        ranking += ` for ${data.lookup(details.commodity, 'commodities', 'text')}`;
      }
      ranking += ` in ${details.year}.`;
      $panel.find('.ranking').html(ranking);
    }
  },


  /*
    * The hover display is coupled with the choropleth
    * The data to be displayed comes from the choropleth which
    * in turn gets it from the data module and processes with the combine
    * function.
    * This is different from the default panel generated on filter change
    * by the populateDefault function above
    */
  displayHover(partnerDetails, countryUnNum) {
    box.populateBox($hoverPanel, partnerDetails, countryUnNum);
    // Animate display of hover panel
    $defaultPanel.stop().slideUp();
    $hoverPanel.stop().slideDown();
  },


  hideHover() {
    // Animate display of default panel
    $hoverPanel.stop().slideUp();
    $defaultPanel.stop().slideDown();
  }


};

export default box;
