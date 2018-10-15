/* global document window */
/*
 * THIS FILE SETS UP the introduction
 * */
import $ from 'jquery';

const introJs = require('intro.js');

const intro = introJs();
const introCookie = document.cookie.replace(/(?:(?:^|.*;\s*)introDone\s*=\s*([^;]*).*$)|^.*$/, '$1');

const steps = [
  // 01. Welcome & description
  {
    intro: '<h3>Welcome to the International Trade in Goods visualization.</h3>' +
      '<p style="font-size: 14px">This tool allows you to explore official trade in goods data using data from HMRC.</p>' +
      '<p style="font-size: 14px">The tool was developed by the Department for International Trade and the Department for Business, Energy and Industrial Strategy in the UK.</p>' +
      '<p style="font-size: 14px">This site uses cookies to make the site simpler. To find out more about cookies used here, please go to the "Cookie policy" page under the "About" menu.</p>' +
      '<p style="font-size: 14px">Please note that there may be occasions when no data is loaded. In this case, the map will be shaded grey, and the graphs will display the message "No data available for this chart". This is because data is unavailable from HMRC for the particular query made.</p>'
  },
  // 02. Controls (overview)
  {
    element: document.querySelector('#controls'),
    intro: 'The controls at the top of the page allow you to filter the data so you can focus on specific information and find what matters to you most.',
    position: 'bottom-middle-aligned'
  },
  // 03. Reporter
  {
    element: document.querySelector('#selectReporterContainer'),
    intro: 'Selecting a reporter is your starting point. You will need to select this to be able to select a partner, commodity and year.',
    position: 'right'
  },
  // 04. Partner
  {
    element: document.querySelector('#selectPartnerContainer'),
    intro: 'Selecting a partner will allow you to see details of trade flows between your selected reporter and partner. These details will show in the Key Facts box and on the graphs below the map.',
    position: 'bottom-middle-aligned'
  },
  // 05 Goods/Service selector
  {
    element: document.querySelector('#selectTypeContainer'),
    intro: 'This will update the map and legend to display data on goods, as selected.',
    position: 'left'
  },
  // 06. Commodity
  {
    element: document.querySelector('#selectCommodityContainer'),
    intro: 'Selecting the commodity box will display a classification of goods. This allows you to drill down the trade data to a greater level of detail. Selecting a commodity will update the map and the graphs below.',
    position: 'left'
  },
  // 07. Flow seleciton
  {
    element: document.querySelector('#flowButtons'),
    intro: 'The map and legend will update based on whether you select ‘exports’, ‘imports’ or ‘balance’.',
    position: 'right'
  },
  // 08. Map
  {
    element: document.querySelector('#choroplethTitle .chartTitle'),
    intro: 'The map visualization shows at a glance the top trading partners for the selected reporter country, and commodity if selected. You can hover over an area on the map to get quick insights into that area, or select the area as a reporter or partner.',
    position: 'bottom-middle-aligned'
  },
  // 09. Download buttons
  {
    element: document.querySelector('#choroplethDropdownMenuDiv'),
    intro: 'You can download the map, and the charts below, using the download options in the small menu next to the map or chart title.',
    position: 'right'
  },
  // 10. Key facts box
  {
    element: document.querySelector('#infoBox'),
    intro: 'The Key Facts box gives a breakdown of trade between your selected reporter and partner, such as export, import, balance and bilateral trade figures.',
    position: 'right'
  },
  // 11. Charts
  {
    element: document.querySelector('#yearChart .chartTitle'),
    intro: 'Below the map, you will find charts showing further detail based on your filter selection. Please note that these will be displayed or hidden based on your selections. You can download these charts by selecting the arrows to the left of the charts.',
    position: 'top'
  },
  // 12. Goodbye
  {
    intro: 'Now try it yourself!'
  }
];

function preventScroll(event) {
  const code = event.keyCode || event.which;
  if (['wheel', 'mousewheel', 'DOMMouseScroll'].indexOf(event.type) > -1 || [32, 33, 34, 35, 36, 38, 40].indexOf(code) > -1) {
    event.preventDefault();
  }
}
function disableScroll() {
  $(window).on('mousewheel.trademap DOMMouseScroll.trademap keydown.trademap', preventScroll);
}
function enableScroll() {
  $(window).off('mousewheel.trademap DOMMouseScroll.trademap keydown.trademap');
}
function scrollToElement(target) {
  let topOffset = Math.max(0, $(target).offset().top - ($(window).height() / 2));
  // Exceptions:
  if (target.id === 'infoBox') {
    topOffset = 0;
    $('#infoBox').css('top', `${$(window).height() - $('#infoBox').height() - 10}px`);
  }
  $('html, body').animate({
    scrollTop: topOffset
  }, 500);
}
function setCookie() {
  document.cookie = 'introDone=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
}
function startIntro() {
  $('html, body').animate({
    scrollTop: 0
  }, 500);
  disableScroll();
  intro.start();
}
function startIntroAfterLoad(event) {
  if (event.queryCount === 0) {
    startIntro();
    window.removeEventListener('queryQueueUpdate', startIntroAfterLoad, false);
  }
}
function finishIntro() {
  enableScroll();
  setCookie();
}

export default {

  setup(urlParameters) {
    // Configure introjs
    intro.setOptions({
      skipLabel: '<span class="glyphicon glyphicon-remove"></span>',
      doneLabel: '<span class="glyphicon glyphicon-remove"></span>',
      nextLabel: '<span class="glyphicon glyphicon-arrow-right"></span>',
      prevLabel: '<span class="glyphicon glyphicon-arrow-left"></span>',
      showBullets: false,
      showStepNumbers: false,
      scrollToElement: false, // We are making our own function below for this
      steps
    });
    intro.oncomplete(finishIntro);
    intro.onexit(finishIntro);
    intro.onbeforechange(scrollToElement);

    // Bind start to #startIntro menu option
    $('#startIntro').click((event) => {
      event.preventDefault();
      startIntro();
    });

    // Start automatically if there is no cookie introDone=true
    // Or force the intro if we have a url parameter intro=true
    if ((!introCookie || urlParameters.intro === 'true') && $(window).width() > 800) {
      // Listen for the "queryQueueUpdate" event and for the event
      // to specify queryCount=0 to trigger the start of the intro
      // once the initial queries have completed
      window.addEventListener('queryQueueUpdate', startIntroAfterLoad, false);
    }
  }

};
