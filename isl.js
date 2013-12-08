var PI2, width, height, RC4Rand, Gradient, poly2clipper, clipper2poly, merge, offset, jitterPoly, IslandGenerator, main;
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
offset = function(poly, delta){
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
IslandGenerator = (function(){
  IslandGenerator.displayName = 'IslandGenerator';
  var prototype = IslandGenerator.prototype, constructor = IslandGenerator;
  function IslandGenerator(seed){
    var rng;
    seed == null && (seed = null);
    this.seed = "" + (seed || +new Date());
    this.rng = rng = new RC4Rand(this.seed);
    this.islets = [];
    this.layers = [];
  }
  prototype.generateIslet = function(){
    var cx, cy, maxRadius, radius, nPoints, points, p, i, xRadius, yRadius, x, y;
    cx = this.rng.uniform(width * 0.2, width * 0.8);
    cy = this.rng.uniform(height * 0.2, height * 0.8);
    maxRadius = Math.min(width, height) * 0.2;
    radius = this.rng.uniform(maxRadius * 0.3, maxRadius);
    nPoints = this.rng.uniformInt(7, 25);
    return points = (function(){
      var to$, results$ = [];
      for (p = 0, to$ = nPoints; p < to$; ++p) {
        i = p / nPoints;
        xRadius = this.rng.uniform(radius * 0.7, radius);
        yRadius = this.rng.uniform(radius * 0.7, radius);
        x = cx + Math.cos(i * PI2) * xRadius;
        y = cy + Math.sin(i * PI2) * yRadius;
        results$.push([x, y]);
      }
      return results$;
    }.call(this));
  };
  prototype.generate = function(){
    var islets, res$, x, layers, i$, x0$, len$, openLayers, maxHeight, layer, heightIncrease, offsetValue, layerJitter, newLayers, res1$, j$, x1$, len1$, k$, x2$, len2$;
    res$ = [];
    for (x = 0; x < 15; ++x) {
      res$.push(this.generateIslet());
    }
    islets = res$;
    layers = [merge(islets)];
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
      heightIncrease = this.rng.uniformInt(5, 50);
      offsetValue = this.rng.uniform(0.9, 1.1) * heightIncrease;
      layerJitter = this.rng.uniformInt(2, 5);
      newLayers = offset(layer, -offsetValue);
      if (newLayers.length) {
        res1$ = [];
        for (j$ = 0, len1$ = newLayers.length; j$ < len1$; ++j$) {
          x1$ = newLayers[j$];
          res1$.push(jitterPoly(this.rng, x1$, layerJitter, layerJitter));
        }
        newLayers = res1$;
        for (k$ = 0, len2$ = newLayers.length; k$ < len2$; ++k$) {
          x2$ = newLayers[k$];
          x2$.height = layer.height + heightIncrease;
        }
        openLayers = openLayers.concat(newLayers);
        layers = layers.concat(newLayers);
      }
    }
    this.islets = islets;
    return this.layers = layers;
  };
  prototype.draw = function(){
    var svg, x0$, topoColorMap, x1$, bwColorMap, colorMap, i$, ref$, len$, layer, cOffset, color, outline, poly, j$, x2$, ref1$, len1$, results$ = [];
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
      poly.node.setAttribute("terr-coff", cOffset);
    }
    for (j$ = 0, len1$ = (ref1$ = this.islets).length; j$ < len1$; ++j$) {
      x2$ = ref1$[j$];
      results$.push(svg.polygon(x2$).stroke({
        width: 1,
        color: 'red'
      }).fill('none'));
    }
    return results$;
  };
  return IslandGenerator;
}());
main = function(){
  var ig;
  ig = new IslandGenerator("hurf a derp");
  ig.generate();
  ig.draw();
  window.ig = ig;
};
main();