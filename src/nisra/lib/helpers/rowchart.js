/*
 * THIS FILE PROVIDES LOGIC TO SETUP AND DRAW BAR CHARTS
 * (so that we don't have to repeat the code for each bar chart)
 * */
import * as d3 from 'd3';

import data from './data';
import controls from './controls';

export default function () {
  const localData = data;
  const barchart = {

    margin: {
      top: 25, right: 60, bottom: 75, left: 35
    },
    innerHeight: 0,
    innerWidth: 0,
    xScale: d3.scale.linear(),
    yScale: d3.scale.linear(),
    xAxis: d3.svg.axis()
      .tickSize(0, 0)
      .tickFormat(''),
    yAxis: d3.svg.axis(),
    barHeight: 0,


    setup(svg) {
      // Set internal graph dimensions
      barchart.innerHeight = svg.attr('height') - barchart.margin.top - barchart.margin.bottom;
      barchart.innerWidth = svg.attr('width') - barchart.margin.left - barchart.margin.right;

      // Setup initial scales and draw axises
      barchart.xScale.range([0, barchart.innerWidth]);
      barchart.yScale.range([0, barchart.innerHeight])
        .clamp(true);
      barchart.xAxis.scale(barchart.xScale)
        .orient('bottom')
        .tickFormat(localData.numFormat);
      barchart.yAxis.scale(barchart.yScale)
        .orient('left');
      svg.append('g')
        .attr('class', 'bars')
        .attr('transform', `translate(${barchart.margin.left},${barchart.margin.top})`);
      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(${barchart.margin.left},${barchart.innerHeight + barchart.margin.top})`)
        .call(barchart.xAxis);
      svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', `translate(${barchart.margin.left},${barchart.margin.top})`)
        .call(barchart.yAxis);
    },


    draw(svg, newData, filters, color) {
      if (newData.length === 0) { console.warn('no new data', filters); }
      // Setup scales & axises
      barchart.xScale.domain([0, d3.max(newData, d => d.value)])
        .nice();
      barchart.yScale.domain([0, d3.max([10, newData.length])])
        .clamp(true)
        .nice();
      barchart.xAxis.scale(barchart.xScale)
        .tickSize(6, 0)
        .tickFormat(localData.numFormat);
      barchart.yAxis.scale(barchart.yScale).ticks(0);
      barchart.barHeight = (barchart.yScale(1) - 20);

      // Remove no data text
      svg.select('text.nodata').remove();

      // Update axises
      svg.select('.x.axis')
        .transition()
        .call(barchart.xAxis)
        .selectAll('text')
        // .filter(function (d,i) { return d!="0"; })
        .attr('transform', 'rotate(-65) translate(-13,-10)')
        .style('text-anchor', 'end');
      svg.select('.y.axis')
        .transition()
        .call(barchart.yAxis);

      // Enter groups and bars
      const groups = svg.select('.bars').selectAll('g.item')
        .data(newData);
      groups.enter()
        .append('g')
        .append('rect')
        .attr('width', '0')
        .attr('height', '0');
      groups.classed('item', true)
        .attr('transform', (d, i) => `translate(0,${barchart.yScale(i)})`);
      groups.selectAll('g.item text').remove();
      const bars = groups.select('rect')
        .on('click', (d) => {
          if (filters.partner === 'all') { // top partner chart: select partner
            controls.changeFilters({ partner: d.partner });
          } else { // top commodities chart: select commodity
            controls.changeFilters({ commodity: d.commodity });
          }
        });
      const labels = groups.append('text').classed('label', true);
      const values = groups.append('text').classed('value', true);

      // Update groups and bars
      bars.transition()
        .attr('x', 0)
        .attr('y', barchart.yScale(1) - barchart.barHeight - 5)
        .style('fill', color)
        .attr('height', barchart.barHeight)
        .attr('width', d => d3.max([0, barchart.xScale(+d.value)]));
      labels
        .attr('x', '3')
        .attr('y', barchart.yScale(1) - barchart.barHeight - 8)
        .text((d) => {
          if (filters.partner === 'all') { // top partner chart: select partner
            return localData.lookup(d.partner, 'partnerAreas', 'text');
          } // top commodities chart: select commodity
          return localData.commodityName(d.commodity, filters.type);
        });
      values
        .attr('x', d => barchart.xScale(+d.value) + 3)
        .attr('y', barchart.yScale(1) - 5)
        .text(d => localData.numFormat(d.value, null, 1));

      // Exit groups
      groups.exit().remove();

      // Display a "No data" text
      if (groups.size() === 0) {
        svg.append('text')
          .text('No data available for this chart.')
          .classed('nodata', true)
          .classed('label', true)
          .attr('x', (barchart.innerWidth / 2) + barchart.margin.left - 75)
          .attr('y', (barchart.innerHeight / 2) + barchart.margin.top - 75);
      }
    },


    resizeSvg(svg, newWidth) {
      svg.attr('width', newWidth);
      barchart.innerWidth = svg.attr('width') - barchart.margin.left - barchart.margin.right;
      // Update xScale and xAxis
      barchart.xScale.range([0, barchart.innerWidth]);
      barchart.xAxis.scale(barchart.xScale);
      svg.select('.x.axis') // change the x axis
        .transition()
        .call(barchart.xAxis);
      // Update bars & text
      const groups = svg.selectAll('g.item');
      groups.selectAll('rect')
        .attr('width', d => barchart.xScale(+d.value) || 1);
      groups.selectAll('text.value')
        .attr('x', d => barchart.xScale(+d.value) + 3);
    }
  };

  return barchart;
}
