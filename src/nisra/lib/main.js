import $ from "jquery";
/*need to also import: Modernizr, d3, dc, crossfilter */

// trademap requirements
import data from './helpers/data';
import gui from './helpers/gui';
import controls from './helpers/controls'
import charts from './helpers/charts'
import embed from './helpers/embed'
import intro from './helpers/intro'

// This jQuery callback makes sure that all code is run after the document and scripts have all loaded properly
$(document).ready(function () {

  // Use Modernizr to check for SVG support and if not present display an error and don't even start loading CSV and setting up charts
  if (!Modernizr.svg) {
    $('#userAlert').removeClass('hidden');
    $('#userAlert .message').html('Error: it looks like your browser does not support SVG which is required for this visualization. Please consider updating to a more recent browser.');
    $('#loadingDiv').hide();
    return;
  }

  // Use Modernizr to check for CORS support and if not present display an error and don't even start loading CSV and setting up charts
  //if (location.host !== 'comtrade.un.org' && !Modernizr.cors) {
  if (!Modernizr.cors) {
    $('#userAlert').removeClass('hidden');
    $('#userAlert .message').html('<strong>Warning</strong>: This application may not work correctly. Your browser does not support querying APIs which is necessary for this application to work. (Missing <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a>).<br /> Please try using a recent version of Firefox or Chrome.');
    $('#loadingDiv').hide();
  }

  // Setup data by calling the initial JSON files
  data.setup(function (err) {
    // If the setup fails display an error and stop.
    if (err) {
      console.log(err);
      $('#userAlert').removeClass('hidden');
      $('#userAlert .message').html('Error: Failed to load required files for startup.');
      return;
    }

    // Check if we have an embed parameter like "embed=yearChart".
    var urlParameters = controls.decodeURL(),
        chartNames = ['choropleth', 'yearChart', 'topImportCommodities', 'topExportCommodities', 'topImportMarkets', 'topExportMarkets'];
    if (urlParameters.embed && chartNames.indexOf(urlParameters.embed)>-1) {
      // If we do, then hide all other charts and call the embed setup and skip the rest
      chartNames.splice(chartNames.indexOf(urlParameters.embed), 1);
      embed.hide(chartNames);
      embed.setup(urlParameters);
      return;
    }

    // Setup the gui
    gui.setup();

    // Setup intro (which will internally check if it should be displayed)
    intro.setup(urlParameters);

    // Setup the controls
    controls.setup();

    // Setup charts
    charts.setup(function () {
      controls.initializeFilters();
    });


  });   // Close data.setup()
});     // Close $(document).ready