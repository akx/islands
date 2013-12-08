var PI2, width, height, RC4Rand, Gradient, poly2clipper, clipper2poly, merge, outsetPoly, jitterPoly, offsetPoly, IntParam, FloatParam, BoolParam, IslandGenerator, makeUI, main;
PI2 = Math.PI * 2;
width = 700;
height = 700;
RC4Rand = (function(){
  RC4Rand.displayName = 'RC4Rand';
  var prototype = RC4Rand.prototype, constructor = RC4Rand;
  function RC4Rand(seed){
    var res$, x;
    res$ = [];
    for (x = 0; x < 256; ++x) {
      res$.push(x);
    }
    this.s = res$;
    this.i = this.j = 0;
    if (seed) {
      this.mix(seed);
    }
  }
  prototype.mix = function(seed){
    var j, i, to$, ch;
    seed = seed + "";
    j = 0;
    for (i = 0, to$ = this.s.length; i < to$; ++i) {
      ch = seed.charCodeAt(i % seed.length) & 0xFF;
      j += this.s[i] + ch;
      j %= 256;
      this._swap(i, j);
    }
  };
  prototype._swap = function(i, j){
    var ref$;
    ref$ = [this.s[i], this.s[j]], this.s[j] = ref$[0], this.s[i] = ref$[1];
  };
  prototype.nextByte = function(){
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.s[this.i]) % 256;
    this._swap(this.i, this.j);
    return this.s[(this.s[this.i] + this.s[this.j]) % 256];
  };
  prototype.nextFloat = function(){
    var BYTES, output, i;
    BYTES = 7;
    output = 0;
    for (i = 0; i < BYTES; ++i) {
      output = output * 256 + this.nextByte();
    }
    return output / (Math.pow(2, BYTES * 8) - 1);
  };
  prototype.uniform = function(a, b){
    return a + this.nextFloat() * (b - a);
  };
  prototype.uniformInt = function(a, b){
    return Math.floor(a + this.nextFloat() * (b - a));
  };
  return RC4Rand;
}());
Gradient = (function(){
  Gradient.displayName = 'Gradient';
  var prototype = Gradient.prototype, constructor = Gradient;
  function Gradient(resolution){
    this.resolution = resolution != null ? resolution : 512;
    this.points = [];
    this.bitmap = null;
  }
  prototype.addPoint = function(color, point){
    this.points.push({
      color: color,
      point: point
    });
  };
  prototype.getColor = function(point){
    var offset, data;
    if (!this.bitmap) {
      this.bitmap = this.render();
    }
    if (point < 0) {
      point = 0;
    }
    if (point > 1) {
      point = 1;
    }
    offset = (0 | point * this.bitmap.width) * 4;
    data = this.bitmap.data;
    return "rgb(" + data[offset] + ", " + data[offset + 1] + ", " + data[offset + 2] + ")";
  };
  prototype.render = function(){
    var canvas, ctx, gradient, i$, ref$, len$, ref1$, color, point;
    canvas = document.createElement("canvas");
    canvas.width = this.resolution;
    canvas.height = 10;
    ctx = canvas.getContext("2d");
    gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (i$ = 0, len$ = (ref$ = this.points).length; i$ < len$; ++i$) {
      ref1$ = ref$[i$], color = ref1$.color, point = ref1$.point;
      gradient.addColorStop(point, color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  return Gradient;
}());
poly2clipper = function(poly){
  var subj_polygon, i$, len$, ref$, x, y;
  subj_polygon = new ClipperLib.Polygon();
  for (i$ = 0, len$ = poly.length; i$ < len$; ++i$) {
    ref$ = poly[i$], x = ref$[0], y = ref$[1];
    subj_polygon.push(new ClipperLib.IntPoint(x, y));
  }
  return subj_polygon;
};
clipper2poly = function(clipper){
  var i$, x0$, ref$, len$, results$ = [];
  for (i$ = 0, len$ = (ref$ = clipper || []).length; i$ < len$; ++i$) {
    x0$ = ref$[i$];
    results$.push([x0$.X, x0$.Y]);
  }
  return results$;
};
merge = function(polys){
  var subj_polygons, clip_polygons, clipper, solution_polygons, clipType, fillType, result;
  polys = [].concat(polys);
  subj_polygons = new ClipperLib.Polygons();
  subj_polygons.push(poly2clipper(polys.shift()));
  clip_polygons = new ClipperLib.Polygons();
  while (polys.length) {
    clip_polygons.push(poly2clipper(polys.shift()));
  }
  clipper = new ClipperLib.Clipper();
  clipper.AddPolygons(subj_polygons, ClipperLib.PolyType.ptSubject);
  clipper.AddPolygons(clip_polygons, ClipperLib.PolyType.ptClip);
  solution_polygons = new ClipperLib.Polygons();
  clipType = ClipperLib.ClipType.ctUnion;
  fillType = ClipperLib.PolyFillType.pftNonZero;
  if (!clipper.Execute(clipType, solution_polygons, fillType, fillType)) {
    console.log("No success.");
  }
  result = clipper2poly(solution_polygons[0]);
  return result;
};
outsetPoly = function(poly, delta){
  var cpr, joinType, miterLimit, offsetPolygons, cleanedPolygons;
  cpr = new ClipperLib.Clipper();
  joinType = ClipperLib.JoinType.jtMiter;
  miterLimit = 0;
  offsetPolygons = cpr.OffsetPolygons([poly2clipper(poly)], delta, joinType, miterLimit, true);
  cleanedPolygons = ClipperLib.Clean(offsetPolygons, 2.5);
  return (function(){
    var i$, x0$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = cleanedPolygons).length; i$ < len$; ++i$) {
      x0$ = ref$[i$];
      results$.push(clipper2poly(x0$));
    }
    return results$;
  }());
};
jitterPoly = function(rng, poly, ix, iy){
  var i$, len$, ref$, x, y, results$ = [];
  for (i$ = 0, len$ = poly.length; i$ < len$; ++i$) {
    ref$ = poly[i$], x = ref$[0], y = ref$[1];
    results$.push([x + rng.uniform(-ix, ix), y + rng.uniform(-iy, iy)]);
  }
  return results$;
};
offsetPoly = function(poly, ix, iy){
  var i$, len$, ref$, x, y, results$ = [];
  for (i$ = 0, len$ = poly.length; i$ < len$; ++i$) {
    ref$ = poly[i$], x = ref$[0], y = ref$[1];
    results$.push([x + ix, y + iy]);
  }
  return results$;
};
IntParam = function(name, value, min, max){
  min == null && (min = 0);
  max == null && (max = 100);
  return {
    name: name,
    value: value,
    min: min,
    max: max,
    type: "int"
  };
};
FloatParam = function(name, value, min, max){
  min == null && (min = 0);
  max == null && (max = 1);
  return {
    name: name,
    value: value,
    min: min,
    max: max,
    type: "float"
  };
};
BoolParam = function(name, value){
  return {
    name: name,
    value: !!value,
    type: "bool"
  };
};
IslandGenerator = (function(){
  IslandGenerator.displayName = 'IslandGenerator';
  var prototype = IslandGenerator.prototype, constructor = IslandGenerator;
  IslandGenerator.PARAMS = [IntParam("isletMinN", 2), IntParam("isletMaxN", 15), FloatParam("isletSpread", 0.3), FloatParam("isletMinRadius", 0.1), FloatParam("isletMaxRadius", 0.3), IntParam("isletMinPoints", 7), IntParam("isletMaxPoints", 25), FloatParam("isletJagginess", 0.2), BoolParam("isletSeparateRadii", true), FloatParam("islandInitialOutset", 0), IntParam("minHeightIncrease", 5), IntParam("maxHeightIncrease", 50), IntParam("minHeightInsetRatio", 0.9, 0, 2), IntParam("maxHeightInsetRatio", 1.1, 0, 2), IntParam("minLayerJitter", 2), IntParam("maxLayerJitter", 5), IntParam("layerOffsetSize", 5)];
  function IslandGenerator(seed){
    var rng, i$, ref$, len$, param;
    seed == null && (seed = null);
    this.seed = "" + (seed || +new Date());
    this.rng = rng = new RC4Rand(this.seed);
    this.params = {
      seed: this.seed
    };
    for (i$ = 0, len$ = (ref$ = IslandGenerator.PARAMS).length; i$ < len$; ++i$) {
      param = ref$[i$];
      this.params[param.name] = param.value;
    }
    this.islets = [];
    this.layers = [];
  }
  prototype.generateIslet = function(){
    var minMul, maxMul, cx, cy, maxRadius, minRadius, nPoints, points, p, i, xRadius, yRadius, x, y;
    minMul = 0.5 - this.params.isletSpread;
    maxMul = 0.5 + this.params.isletSpread;
    cx = this.rng.uniform(width * minMul, width * maxMul);
    cy = this.rng.uniform(height * minMul, height * maxMul);
    maxRadius = this.rng.uniform(Math.min(width, height) * this.params.isletMinRadius, Math.min(width, height) * this.params.isletMaxRadius);
    minRadius = maxRadius - maxRadius * this.params.isletJagginess;
    nPoints = this.rng.uniformInt(this.params.isletMinPoints, this.params.isletMaxPoints);
    points = [];
    for (p = 0; p < nPoints; ++p) {
      i = p / nPoints;
      xRadius = this.rng.uniform(minRadius, maxRadius);
      yRadius = this.rng.uniform(minRadius, maxRadius);
      if (!this.params.isletSeparateRadii) {
        xRadius = yRadius = (xRadius + yRadius) * 0.5;
      }
      x = cx + Math.cos(i * PI2) * xRadius;
      y = cy + Math.sin(i * PI2) * yRadius;
      points.push([x, y]);
    }
    return points;
  };
  prototype.generate = function(){
    var nIslets, islets, x, layers, i$, x0$, len$, openLayers, maxHeight, layer, heightIncrease, offsetValue, layerJitter, layerXOffset, layerYOffset, newLayers, res$, j$, x1$, len1$, k$, x2$, len2$;
    nIslets = this.rng.uniformInt(this.params.isletMinN, this.params.isletMaxN);
    this.islets = islets = (function(){
      var to$, results$ = [];
      for (x = 0, to$ = nIslets; x < to$; ++x) {
        results$.push(this.generateIslet());
      }
      return results$;
    }.call(this));
    layers = outsetPoly(merge(islets), this.params.islandInitialOutset);
    for (i$ = 0, len$ = layers.length; i$ < len$; ++i$) {
      x0$ = layers[i$];
      x0$.height = 0;
    }
    openLayers = [].concat(layers);
    this.maxHeight = maxHeight = this.rng.uniformInt(200, 400);
    while (openLayers.length) {
      layer = openLayers.shift();
      if (this.rng.uniform(0, 1) < 0.05) {
        console.log("skipping layer");
        continue;
      }
      if (layer.height > maxHeight) {
        console.log("maxheight " + maxHeight + " reached");
        break;
      }
      heightIncrease = this.rng.uniformInt(this.params.minHeightIncrease, this.params.maxHeightIncrease);
      offsetValue = this.rng.uniform(this.params.minHeightInsetRatio, this.params.maxHeightInsetRatio) * heightIncrease;
      layerJitter = this.rng.uniformInt(this.params.minLayerJitter, this.params.maxLayerJitter);
      layerXOffset = this.rng.uniformInt(-this.params.layerOffsetSize, this.params.layerOffsetSize);
      layerYOffset = this.rng.uniformInt(-this.params.layerOffsetSize, this.params.layerOffsetSize);
      newLayers = outsetPoly(layer, -offsetValue);
      if (newLayers.length) {
        res$ = [];
        for (j$ = 0, len1$ = newLayers.length; j$ < len1$; ++j$) {
          x1$ = newLayers[j$];
          res$.push(offsetPoly(jitterPoly(this.rng, x1$, layerJitter, layerJitter), layerXOffset, layerYOffset));
        }
        newLayers = res$;
        for (k$ = 0, len2$ = newLayers.length; k$ < len2$; ++k$) {
          x2$ = newLayers[k$];
          x2$.height = layer.height + heightIncrease;
        }
        openLayers = openLayers.concat(newLayers);
        layers = layers.concat(newLayers);
      }
    }
    return this.layers = layers;
  };
  prototype.draw = function(){
    var svg, x0$, topoColorMap, x1$, bwColorMap, colorMap, i$, ref$, len$, layer, cOffset, color, outline, poly, results$ = [];
    svg = SVG(document.body);
    svg.size(width, height);
    svg.rect(width, height).fill('#53BEFF');
    x0$ = topoColorMap = new Gradient();
    x0$.addPoint('#acd0a5', 0);
    x0$.addPoint('#94bf8b', 0.2);
    x0$.addPoint('#bdcc96', 0.5);
    x0$.addPoint('#efebc0', 0.8);
    x0$.addPoint('#cab982', 0.99);
    x0$.addPoint('#cab982', 1.0);
    x1$ = bwColorMap = new Gradient();
    x1$.addPoint('black', 0);
    x1$.addPoint('white', 1);
    colorMap = topoColorMap;
    for (i$ = 0, len$ = (ref$ = this.layers).length; i$ < len$; ++i$) {
      layer = ref$[i$];
      cOffset = layer.height / this.maxHeight;
      color = colorMap.getColor(cOffset);
      outline = layer.height == 0 ? 'black' : 'rgba(0,0,0,0.2)';
      poly = svg.polygon(layer).stroke({
        width: 1,
        color: outline
      }).fill(color);
      poly.node.setAttribute("terr-height", layer.height);
      results$.push(poly.node.setAttribute("terr-coff", cOffset));
    }
    return results$;
  };
  return IslandGenerator;
}());
makeUI = function(){
  var i$, ref$, len$, param;
  for (i$ = 0, len$ = (ref$ = IslandGenerator.PARAMS).length; i$ < len$; ++i$) {
    param = ref$[i$];
    console.log(param);
  }
};
main = function(){
  var ig;
  window.ig = ig = new IslandGenerator("dkkkhurf a der3");
  ig.generate();
  ig.draw();
};
makeUI();
main();