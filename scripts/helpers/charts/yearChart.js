/*jslint browser: true*/
/*jslint white: true */
/*jslint vars: true */
/*jslint nomen: true*/
/*global $, Modernizr, d3, dc, crossfilter, document, console, alert, define, DEBUG */


/*
 * THIS FILE SETS UP THE yearChart chart
 * */


define(['../data', '../gui', '../controls'], function(data, gui, controls) {
  'use strict';

  var localData = data,
      $container = $('#yearChart'),
      $chart = $container.children('.chart'),
      $chartTitle = $container.children('.chartTitle'),

      // SVG main properties
      svg = d3.select('#yearChart .chart')
        .append('svg')
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", 1.1)
        .classed('svgChart', true),
      margin = {top: 25, right: 15, bottom: 75, left: 70},
      height = $chart.height(),
      width  = $chart.width(),
      innerHeight = height - margin.top - margin.bottom,
      innerWidth = width - margin.left - margin.right,

      // Chart main objects
      xScale = d3.scale.linear().range([0, innerWidth]).clamp(true),
      yScale = d3.scale.linear().range([innerHeight, 0]),
      xAxis  = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickFormat(d3.format(".0f")),
      yAxis  = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(6)
        .tickFormat(localData.numFormat),
      line   = d3.svg.line()
        .interpolate('linear'),




      chart = {




        setup: function () {
          // Bind the refresh function to the refreshFilters event
          $chart.on('refreshFilters', this.refresh);

          // Bind the resize function to the window resize event
          $(window).on('resize', this.resizeSvg);

          // Setup SVG and add axises and groups
          svg.attr('width', width)
            .attr('height', height);
          svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate('+margin.left+',' + (margin.top+innerHeight) + ')')
            .call(xAxis);
          svg.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate('+margin.left+',' + margin.top + ')')
            .call(yAxis);
          svg.append('g')
            .attr('class', 'plots')
            .attr('transform', 'translate('+margin.left+',' + margin.top + ')');

          // Draw legend
          var legendItems = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate('+(innerWidth+margin.left-chart.colors[0].length*120)+',0)')
            .selectAll('.legendItem')
            .data(chart.colors[0])
            .enter()
            .append('g')
            .attr('class','legendItem');
          legendItems.append('circle')
            .attr('cx', function (d, i) { return i*120; })
            .attr('cy', '10')
            .attr('r', '5')
            .style('fill', function (d) { return d; });
          legendItems.append('text')
            .attr('transform', function (d, i) {
              return 'translate('+(i*120+10)+',15)';
            })
            .text(function(d,i) { return ['Imports','Exports'][i]; } );


          // Hide on load
          $container.slideUp(0);
        },




        refresh: function (event, filters) {

          // CASE 1: reporter = null
          if(!filters.reporter) {
            $container.slideUp();
            return;
          }

          // We build a queryFilter and a dataFilter object to make API queries more generic than data queries (see case 2 and 5 below)
          var queryFilter = {
                reporter: +filters.reporter,
                year:   'all',
                initiator: 'yearChart',
                type: filters.type
              },
              dataFilter = {
                reporter: +filters.reporter,
                year:   'all',
                type: filters.type
              },
              title = '';

          // CASE 2: reporter = selected    commodity = null        partner = null
          if(filters.reporter && !filters.commodity && !filters.partner) {
            title = localData.lookup(filters.reporter, 'reporterAreas', 'text') + ' trade in '+({ S: 'services', C: 'goods' })[filters.type]+' with the world';
            queryFilter.partner =  0;
            queryFilter.commodity = 'TOTAL';
            dataFilter = queryFilter;
          }

          // CASE 3: reporter = selected    commodity = null        partner = selected
          if(filters.reporter && !filters.commodity && filters.partner) {
            title = localData.lookup(filters.reporter, 'reporterAreas', 'text') + ' trade in '+({ S: 'services', C: 'goods' })[filters.type]+' with ' + localData.lookup(filters.partner, 'partnerAreas', 'text');
            queryFilter.partner = filters.partner;
            queryFilter.commodity = 'TOTAL';
            dataFilter.partner = +filters.partner;
            dataFilter.commodity = 'TOTAL';
          }

          // CASE 4: reporter = selected    commodity = selected    partner = selected
          // NOTE This is already covered by the data in CASE 3 so we don't specify the commodity in the query to avoid duplicate data
          if(filters.reporter && filters.commodity && filters.partner) {
            title = localData.lookup(filters.reporter, 'reporterAreas', 'text') + ' trade in ' + localData.commodityName(filters.commodity, filters.type) + ' with ' + localData.lookup(filters.partner, 'partnerAreas', 'text');
            queryFilter.partner = +filters.partner;
            queryFilter.commodity = filters.commodity;
            dataFilter.partner = +filters.partner;
            dataFilter.commodity = filters.commodity;
          }

          // CASE 5: reporter = selected    commodity = selected    partner = null
          if(filters.reporter && filters.commodity && !filters.partner) {
            title = localData.lookup(filters.reporter, 'reporterAreas', 'text') + ' trade in ' + localData.commodityName(filters.commodity, filters.type) + ' with the world';
            queryFilter.partner = 0;
            queryFilter.commodity = filters.commodity;
            dataFilter.partner = 0;
            dataFilter.commodity = filters.commodity;
          }

          // Run the query, display the panel and redraw the chart
          data.query(queryFilter, function queryCallback (err, ready) {
            if (err) { gui.showError(err); }
            if (err || !ready) { return; }
            // Get the data, display panel and update chart
            var newData = localData.getData(dataFilter);
            // Get the start year of the data and append "since" part to title.
            var startYear = d3.min(newData, function (d) { return d.year; });
            title += ' since ' + startYear;
            // Set chart title
            $chartTitle.html(title);
            // Set download link
            $container.find('.downloadData').unbind('click').on('click', function (e) {
              e.preventDefault();
              gui.downloadCsv(title, newData);
            });
            $container.slideDown(400, function () {
              chart._draw(newData);
            });
          });

        },




        _draw: function (newData) {

          // If no data is available display a "No data available" message.
          if (newData.length === 0) {
            svg.append('text')
              .text('No data available for this chart.')
              .classed('nodata', true)
              .classed('label', true)
              .attr('x', innerWidth/2+margin.left-75)
              .attr('y', innerHeight/2+margin.top-75);
            // And remove lines and dots
            svg.selectAll('.flow').remove();
            return;
          } else {
            svg.selectAll('.nodata').remove();
          }

          // Prepare data
          var nestedData = d3.nest()
                .key(function(d) { return d.flow; })
                .sortValues(function(a,b) { return a.year - b.year; } )
                .entries(newData),
              yearExtent = d3.extent(newData, function (d) { return d.year; }),
              yearRange = d3.range(yearExtent[0], yearExtent[1]+1),
              tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) { return d.year+': '+localData.numFormat(d.value, null, 1)+' '+['imports', 'exports'][d.flow-1]; });

          // If there is data only for one flow direction add an empty nest.
          if (nestedData.length < 2) {
            console.log(nestedData);
            if (+nestedData[0].key === 2) {
              nestedData.unshift({ key: 1, values: [] });
            } else {
              nestedData.push({ key: 2, values: [] });
            }
            console.log(nestedData);
          }

          // Update scale domains with newData values and the line generation function
          xScale.domain([yearExtent[0], yearExtent[1]+1]);
          yScale.domain([0,d3.max(newData, function (d) { return d.value; })]);
          line.x(function(d) { return xScale(d.year); })
            .y(function(d) { return yScale(d.value); });
          xAxis.scale(xScale)
            .tickValues(yearRange)
            .tickSize(6, 0)
            .tickFormat(d3.format(".0f"));
          yAxis.scale(yScale)
            .tickSize(6, 0)
            .tickFormat(localData.numFormat);

          // Update yearSelect dropdown with new year range
          controls.updateYears(yearRange);

          // Update axis
          svg.select('.x.axis') // change the x axis
            .transition()
            .call(xAxis)
            .selectAll('g.x text')
            .attr("transform", 'rotate(-65) translate(-22,-10)');
          svg.select('.y.axis') // change the y axis
            .transition()
            .call(yAxis);

          // Add line to highlight year
          var hl = svg.selectAll('line.yearHighlight')
                     .data([1]),
              selectedYear = $('#selectYear').val();
          hl.enter()
            .append('line')
            .attr('class', 'yearHighlight')
            .attr('x1', '0')
            .attr('y1', margin.top)
            .attr('x2', '0')
            .attr('y2', margin.top+innerHeight)
            .attr('stroke', '#054D82')
            .attr('stroke-dasharray', '5, 5')
            .attr('stroke-width', '1');
          hl.transition()
            .attr('x1', function (d) { return xScale(+selectedYear)+margin.left; })
            .attr('x2', function (d) { return xScale(+selectedYear)+margin.left; });
          // TODO Highlight dots for year
          // TODO Highlight xAxis label


          // Draw groups and then in each group lines and dots
          var plotGraph = svg.select('.plots'),
              lines = plotGraph.selectAll('path.flow')
                .data(nestedData);
          // Add lines
          lines.enter()
            .append('path')
            .attr('class', 'flow')
            .style("stroke", function(d) { return chart.colors[0][d.key-1]; })
            .style("fill", 'none')
            .style("stroke-width", '1.5px');
          // Transition to new path layout
          lines.transition()
            .attr('d', function (d) { return line(d.values); });

          // Add dots in groups
          var dotGroups = plotGraph.selectAll('g.flow')
            .data(nestedData);
          dotGroups.enter()
            .append('g')
            .attr('class', 'flow');
          var dots = dotGroups.selectAll('circle.dot')
            .data(function (d) { return d.values; });
          dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('r', '3')
            .style("fill", function(d) { return chart.colors[0][d.flow-1]; })
            .style("stroke-width", '0')
            .on('mouseover', function (d) {
              tip.show(d);
              d3.select(this).interrupt().transition().attr('r', '6');
            })
            .on('mouseout', function (d) {
              tip.hide(d);
              d3.select(this).interrupt().transition().attr('r', '3');
            })
            .on('click', function (d) {
              controls.changeFilters({ year: d.year });
            });
          // Transition dot positions
          dots.transition()
            .attr('cx', function (d) { return xScale(d.year); })
            .attr('cy', function (d) { return yScale(d.value); });
          // Remove unneeded dots
          dots.exit().remove();

          // Add tooltip
          plotGraph.call(tip);

        },




        resizeSvg: function () {
          // Get new size & set new size to svg element
          width = $chart.width();
          svg.attr('width', width);
          // Update xScale
          innerWidth = width - margin.left - margin.right;
          xScale.range([0, innerWidth]);
          xAxis.scale(xScale);
          // Redraw x axis
          svg.select('.x.axis') // change the x axis
            .transition()
            .call(xAxis);
          // Move legend
          svg.select('g.legend')
            .attr('transform', 'translate('+(innerWidth+margin.left-chart.colors[0].length*120)+',0)');
          // Move dots
          svg.selectAll('circle.dot')
            .transition()
            .attr('cx', function (d) { return xScale(d.year); });
          // Update line paths
          line.x(function(d) { return xScale(d.year); });
          svg.selectAll('path.flow')
            .transition()
            .attr('d', function (d) { return line(d.values); });
          // Move highlight
          var selectedYear = $('#selectYear').val();
          svg.selectAll('line.yearHighlight')
            .transition()
            .attr('x1', function (d) { return xScale(+selectedYear)+margin.left; })
            .attr('x2', function (d) { return xScale(+selectedYear)+margin.left; });
        }
  };

  return chart;
});
