const ClipperLib = require('clipper-lib');
const SVG = require('svg.js');
import {RandomFarm} from './rand';
import {ParamCollection, BoolParam, StringParam, IntParam, FloatParam} from './params';
import drawIslandSVG from './drawIslandSVG';

const PI2 = Math.PI * 2;

const poly2clipper = (poly) => {
  const clipperPath = new ClipperLib.Path();
  poly.forEach(([x, y]) => clipperPath.push(new ClipperLib.IntPoint(x, y)));
  return clipperPath;
};

const clipper2poly = (clipper) => {
  return Array.from(clipper).map((point) => [point.X, point.Y]);
};

function poly_op(polys1, polys2, clipType) {
  const subj_polygons = new ClipperLib.Paths();
  const clip_polygons = new ClipperLib.Paths();
  polys1.forEach((poly) => subj_polygons.push(poly2clipper(poly)));
  polys2.forEach((poly) => clip_polygons.push(poly2clipper(poly)));

  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(subj_polygons, ClipperLib.PolyType.ptSubject, true);
  clipper.AddPaths(clip_polygons, ClipperLib.PolyType.ptClip, true);
  const solution_polygons = new ClipperLib.Paths();
  const fillType = ClipperLib.PolyFillType.pftPositive;
  if (!clipper.Execute(clipType, solution_polygons, fillType, fillType)) {
    console.log("No success.");
    return [];
  }
  return Array.from(solution_polygons).map(clipper2poly);
}

function merge(polys) {
  const polys2 = [].concat(polys);
  const polys1 = [polys2.shift()];
  return poly_op(polys1, polys2, ClipperLib.ClipType.ctUnion);
}

function cut(polys1, polys2) {
  return poly_op(polys1, polys2, ClipperLib.ClipType.ctDifference);
}

function outsetPoly(poly, delta) {
  const joinType = ClipperLib.JoinType.jtMiter;
  const miterLimit = 0;
  const clipperOffset = new ClipperLib.ClipperOffset(miterLimit, 0);
  clipperOffset.AddPaths([poly2clipper(poly)], joinType, ClipperLib.EndType.etClosedPolygon);
  const solution = new ClipperLib.Paths();
  clipperOffset.Execute(solution, delta);
  const cleanedPaths = ClipperLib.JS.Clean(solution, 2.5);
  return Array.from(cleanedPaths).map(clipper2poly);
}

function makeRotator(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return function (x, y) {
    return [x * c - y * s, x * s + y * c];
  };
}

function jitterPoly(rng, poly, ix, iy) {
  return poly.map(([x, y]) => [
    x + rng.uniform(-ix, ix),
    y + rng.uniform(-iy, iy),
  ]);
}

function offsetPoly(poly, ix, iy) {
  return poly.map(([x, y]) => [x + ix, y + iy]);
}

const IslandGeneratorParams = new ParamCollection();
IslandGeneratorParams.group(null, [
  StringParam("seed", "" + (+new Date())),
  IntParam("size", 600, 0, 2048)
]);
IslandGeneratorParams.group("Drawing", [
  BoolParam("isletOutlines", false),
  BoolParam("contourOutlines", true),
  BoolParam("bwColorMap", false),
  IntParam("blurContours", 0, 0, 20),
]);
IslandGeneratorParams.group("Islets", [
  IntParam("isletMinN", 2),
  IntParam("isletMaxN", 15),
  FloatParam("isletSpread", 0.3),
  FloatParam("isletMinRadius", 0.1),
  FloatParam("isletMaxRadius", 0.3),
  IntParam("isletMinPoints", 7),
  IntParam("isletMaxPoints", 25),
  FloatParam("isletJagginess", 0.2),
  BoolParam("isletSeparateRadii", true),
  FloatParam("isletMinAspect", 0.9, 0, 2),
  FloatParam("isletMaxAspect", 1.1, 0, 2),
  FloatParam("isletMinAngle", -0.3, -1, 1),
  FloatParam("isletMaxAngle", +0.3, -1, 1),
  FloatParam("isletNegativeChance", 0.05),
]);
IslandGeneratorParams.group("Layers", [
  IntParam("islandInitialOutset", 0, -15, +15),
  IntParam("minHeightIncrease", 5),
  IntParam("maxHeightIncrease", 50),
  FloatParam("minHeightInsetRatio", 0.9, 0, 2),
  FloatParam("maxHeightInsetRatio", 1.1, 0, 2),
  IntParam("minLayerJitter", 2),
  IntParam("maxLayerJitter", 5),
  IntParam("layerOffsetSize", 5),
]);


class IslandGenerator {

  constructor() {
    this.params = IslandGeneratorParams.initialize();
    this.islets = [];
    this.layers = [];
  }


  generateIslet(rng) {
    const minMul = 0.5 - this.params.isletSpread;
    const maxMul = 0.5 + this.params.isletSpread;
    const cx = rng.uniform(this.width * minMul, this.width * maxMul);
    const cy = rng.uniform(this.height * minMul, this.height * maxMul);
    const minSize = Math.min(this.width, this.height);
    const maxRadius = rng.uniform(minSize * this.params.isletMinRadius, minSize * this.params.isletMaxRadius);
    const minRadius = maxRadius - maxRadius * this.params.isletJagginess;
    const nPoints = rng.uniformInt(this.params.isletMinPoints, this.params.isletMaxPoints);
    const points = [];
    const aspect = rng.uniform(this.params.isletMinAspect, this.params.isletMaxAspect);
    const angle = rng.uniform(this.params.isletMinAngle, this.params.isletMaxAngle) * PI2;
    const rotate = makeRotator(angle);

    for (let p = 0; p < nPoints; p++) {
      const i = p / nPoints;
      let xRadius = rng.uniform(minRadius, maxRadius);
      let yRadius = rng.uniform(minRadius, maxRadius);
      if (!this.params.isletSeparateRadii) {
        xRadius = yRadius = (xRadius + yRadius) * 0.5;
      }
      xRadius /= aspect;
      yRadius *= aspect;
      const [x, y] = rotate(
        Math.cos(i * PI2) * xRadius,
        Math.sin(i * PI2) * yRadius
      );
      points.push([cx + x, cy + y]);
    }

    points.negative = (rng.uniform(0, 1) <= this.params.isletNegativeChance);

    return points;
  }

  convertIsletsToLayers(rng, islets) {
    let layers = [];
    const positiveIslets = islets.filter((islet) => !islet.negative);
    const negativeIslets = islets.filter((islet) => islet.negative);

    if (negativeIslets.length) {
      islets = cut(positiveIslets, negativeIslets);
    }

    merge(islets).forEach((isletPoly) => {
      outsetPoly(isletPoly, this.params.islandInitialOutset).forEach((layer) => {
        layer.height = 0;
        layers.push(layer);
      });
    });

    let openLayers = [].concat(layers);
    const maxHeight = rng.uniformInt(200, 400);
    this.maxHeight = maxHeight;

    while (openLayers.length) {
      const layer = openLayers.shift();
      if (rng.uniform(0, 1) < 0.05) { // Chance to skip
        console.log("skipping layer");
        continue;
      }

      if (layer.height > maxHeight) {
        console.log(`maxheight ${maxHeight} reached`);
        break;
      }

      const heightIncrease = rng.uniformInt(this.params.minHeightIncrease, this.params.maxHeightIncrease);
      const offsetValue = rng.uniform(this.params.minHeightInsetRatio, this.params.maxHeightInsetRatio) * heightIncrease;
      const layerJitter = rng.uniform(this.params.minLayerJitter, this.params.maxLayerJitter);

      let newLayers = outsetPoly(layer, -offsetValue);
      if (newLayers.length) {
        newLayers = newLayers.map((newLayer) => {
          const layerXOffset = rng.uniform(-this.params.layerOffsetSize, this.params.layerOffsetSize);
          const layerYOffset = rng.uniform(-this.params.layerOffsetSize, this.params.layerOffsetSize);
          newLayer = jitterPoly(rng, newLayer, layerJitter, layerJitter);
          newLayer = offsetPoly(newLayer, layerXOffset, layerYOffset);
          newLayer.height = layer.height + heightIncrease;
          return newLayer;
        });
        openLayers = openLayers.concat(newLayers);
        layers = layers.concat(newLayers);
      }
      else {
        console.log("no new layers");
      }
    }

    return layers;
  }

  generateIslets(isletRng) {
    const nIslets = isletRng.uniformInt(this.params.isletMinN, this.params.isletMaxN);
    const islets = [];
    for (var i = 0; i < nIslets; i++) {
      islets.push(this.generateIslet(isletRng));
    }
    return islets;
  }

  generate() {
    this.width = this.height = 0 | (this.params.size);
    const time = +new Date();
    this.rngFarm = new RandomFarm(this.params.seed);
    const isletRng = this.rngFarm.get("islet");
    const layerRng = this.rngFarm.get("layer");
    this.islets = this.generateIslets(isletRng);
    this.layers = this.convertIsletsToLayers(layerRng, this.islets);
    return this.genTime = ((+new Date()) - time);
  }

  draw() {
    if(!this.svg) {
      this.svg = SVG(document.body);
    }
    this.svg.size(this.width, this.height).clear();
    drawIslandSVG(
      this.svg,
      this,
      {
        monochrome: !!this.params.bwColorMap,
        blur: this.params.blurContours,
        isletOutlines: !!this.params.isletOutlines,
        contourOutlines: !!this.params.contourOutlines,
      }
    );
  }

  regenerateAndDraw() {
    this.generate();
    this.draw();
    console.log(`generated in ${this.genTime} ms`);
  }
}
IslandGenerator.PARAMS = IslandGeneratorParams;

export default IslandGenerator;
