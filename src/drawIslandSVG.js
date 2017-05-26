import Gradient from './Gradient';

const SVG = require('svg.js');  // eslint-disable-line
require('svg.filter.js');

const bwColorMap = new Gradient();
bwColorMap.addPoint('#222222', 0);
bwColorMap.addPoint('#ffffff', 1);
const topoColorMap = new Gradient();
topoColorMap.addPoint('#94bf8b', 0);
topoColorMap.addPoint('#acd0a5', 0.2);
topoColorMap.addPoint('#bdcc96', 0.5);
topoColorMap.addPoint('#efebc0', 0.8);
topoColorMap.addPoint('#cab982', 0.99);
topoColorMap.addPoint('#cab982', 1.0);

const defaults = {
  monochrome: false,
  isletOutlines: false,
  contourOutlines: true,
  blur: 0,
};

export default function (svg, generator, options = {}) {
  const { monochrome, isletOutlines, contourOutlines, blur } = Object.assign({}, defaults, options);
  const { width, height } = generator;
  const background = (monochrome ? '#000000' : '#53BEFF');
  svg.rect(width, height).fill(background);
  const colorMap = (monochrome ? bwColorMap : topoColorMap);
  const maxHeight = generator.maxHeight || Math.max.apply(null, generator.layers.map((layer) => layer.height));
  generator.layers.forEach((layer) => {
    const cOffset = layer.height / maxHeight;
    const color = colorMap.getColor(cOffset);
    const outline = (layer.height === 0 ? 'black' : 'rgba(0,0,0,0.2)');
    const poly = svg.polygon(layer).fill(color);
    if (contourOutlines) {
      poly.stroke({ width: 1, color: outline });
    }
    if (blur) {
      poly.filter((p) => p.gaussianBlur(blur));
    }

    // poly.node.setAttribute("terr-height", layer.height)
    // poly.node.setAttribute("terr-coff", cOffset)
  });

  if (isletOutlines) {
    generator.islets.forEach((islet) => {
      const color = (islet.negative ? 'red' : 'white');
      svg.polygon(islet).stroke({ width: 1, color }).fill('none');
    });
  }
  return svg;
}
