import $ from 'jquery';
import * as d3 from 'd3';
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { feature } from 'topojson-client';

import nutsJson from '../../data/nuts.topo.json';

const $nutsMap = $('#nutsMap');

// SVG main properties
const height = 250;
const width = 250;
let svg;

const nutsMap = {

  setup(clickHandler) {
    svg = d3.select('#nutsMap')
      .append('svg')
      .classed('nutsMap', true)
      .attr('version', 1.1)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('id', 'nutsMapSvg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const projection = geoKavrayskiy7()
      .scale(1450)
      .translate([180, 1488])
      .precision(0.1);
    const path = d3.geoPath()
      .projection(projection);
    const nuts = feature(nutsJson, nutsJson.objects.nuts).features;

    svg.append('g')
      .attr('class', 'nuts1')
      .selectAll('path')
      .data(nuts)
      .enter()
      .append('path')
      .attr('class', d => `region-${d.properties.objectid}`)
      .classed('nutsRegion', true)
      .attr('d', path)
      .on('click', (d) => {
        d3.event.preventDefault();
        clickHandler(d);
      });

    nutsMap.resizeSvg();
  },

  resizeSvg() {
    svg.attr('width', $nutsMap.width())
      .attr('height', $nutsMap.height());
  },

  select(mapId) {
    svg.select('g.nuts1').selectAll('.nutsRegion')
      .classed('highlighted', false);
    svg.select('g.nuts1').select(`.region-${mapId}`)
      .classed('highlighted', true);
  }
};

export default nutsMap;
