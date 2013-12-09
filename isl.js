var PI2, width, height, RC4Rand, RandomFarm, Gradient, poly2clipper, clipper2poly, poly_op, merge, cut, outsetPoly, makeRotator, jitterPoly, offsetPoly, IntParam, FloatParam, BoolParam, StringParam, ParamGroup, ParamCollection, IslandGenerator, makeUI, main;
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
    var ref$;
    if (b < a) {
      ref$ = [b, a], a = ref$[0], b = ref$[1];
    }
    return a + this.nextFloat() * (b - a);
  };
  prototype.uniformInt = function(a, b){
    return Math.floor(this.uniform(a, b));
  };
  return RC4Rand;
}());
RandomFarm = (function(){
  RandomFarm.displayName = 'RandomFarm';
  var prototype = RandomFarm.prototype, constructor = RandomFarm;
  function RandomFarm(seed){
    this.seed = seed;
  }
  prototype.get = function(name){
    return new RC4Rand(this.seed + "+" + name);
  };
  return RandomFarm;
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
poly_op = function(polys1, polys2, clipType){
  var subj_polygons, i$, x0$, len$, clip_polygons, j$, x1$, len1$, clipper, solution_polygons, fillType;
  subj_polygons = new ClipperLib.Polygons();
  for (i$ = 0, len$ = polys1.length; i$ < len$; ++i$) {
    x0$ = polys1[i$];
    subj_polygons.push(poly2clipper(x0$));
  }
  clip_polygons = new ClipperLib.Polygons();
  for (j$ = 0, len1$ = polys2.length; j$ < len1$; ++j$) {
    x1$ = polys2[j$];
    clip_polygons.push(poly2clipper(x1$));
  }
  clipper = new ClipperLib.Clipper();
  clipper.AddPolygons(subj_polygons, ClipperLib.PolyType.ptSubject);
  clipper.AddPolygons(clip_polygons, ClipperLib.PolyType.ptClip);
  solution_polygons = new ClipperLib.Polygons();
  fillType = ClipperLib.PolyFillType.pftPositive;
  if (!clipper.Execute(clipType, solution_polygons, fillType, fillType)) {
    console.log("No success.");
    return [];
  } else {
    return (function(){
      var i$, x2$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = solution_polygons).length; i$ < len$; ++i$) {
        x2$ = ref$[i$];
        results$.push(clipper2poly(x2$));
      }
      return results$;
    }());
  }
};
merge = function(polys){
  var polys2, polys1;
  polys2 = [].concat(polys);
  polys1 = [polys2.shift()];
  return poly_op(polys1, polys2, ClipperLib.ClipType.ctUnion);
};
cut = function(polys1, polys2){
  return poly_op(polys1, polys2, ClipperLib.ClipType.ctDifference);
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
makeRotator = function(a){
  var c, s;
  c = Math.cos(a);
  s = Math.sin(a);
  return function(x, y){
    return [x * c - y * s, x * s + y * c];
  };
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
  max == null && (max = 1.0);
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
StringParam = function(name, value){
  return {
    name: name,
    value: value + "",
    type: "string"
  };
};
ParamGroup = (function(){
  ParamGroup.displayName = 'ParamGroup';
  var prototype = ParamGroup.prototype, constructor = ParamGroup;
  function ParamGroup(name, params){
    this.name = name;
    this.params = params;
  }
  return ParamGroup;
}());
ParamCollection = (function(){
  ParamCollection.displayName = 'ParamCollection';
  var prototype = ParamCollection.prototype, constructor = ParamCollection;
  function ParamCollection(){
    this.groups = [];
  }
  prototype.group = function(name, params){
    return this.groups.push(new ParamGroup(name, params));
  };
  prototype.initialize = function(){
    var params, i$, ref$, len$, group, j$, ref1$, len1$, param;
    params = {};
    for (i$ = 0, len$ = (ref$ = this.groups).length; i$ < len$; ++i$) {
      group = ref$[i$];
      for (j$ = 0, len1$ = (ref1$ = group.params).length; j$ < len1$; ++j$) {
        param = ref1$[j$];
        params[param.name] = param.value;
      }
    }
    return params;
  };
  return ParamCollection;
}());
IslandGenerator = (function(){
  IslandGenerator.displayName = 'IslandGenerator';
  var x0$, prototype = IslandGenerator.prototype, constructor = IslandGenerator;
  IslandGenerator.PARAMS = (x0$ = new ParamCollection(), x0$.group(null, [StringParam("seed", "" + (+new Date()))]), x0$.group("Drawing", [BoolParam("isletOutlines", false), BoolParam("contourOutlines", true), BoolParam("bwColorMap", false), IntParam("blurContours", 0, 0, 20)]), x0$.group("Islets", [IntParam("isletMinN", 2), IntParam("isletMaxN", 15), FloatParam("isletSpread", 0.3), FloatParam("isletMinRadius", 0.1), FloatParam("isletMaxRadius", 0.3), IntParam("isletMinPoints", 7), IntParam("isletMaxPoints", 25), FloatParam("isletJagginess", 0.2), BoolParam("isletSeparateRadii", true), FloatParam("isletMinAspect", 0.9, 0, 2), FloatParam("isletMaxAspect", 1.1, 0, 2), FloatParam("isletMinAngle", -0.3, -1, 1), FloatParam("isletMaxAngle", +0.3, -1, 1), FloatParam("isletNegativeChance", 0.05)]), x0$.group("Layers", [IntParam("islandInitialOutset", 0, -15, +15), IntParam("minHeightIncrease", 5), IntParam("maxHeightIncrease", 50), FloatParam("minHeightInsetRatio", 0.9, 0, 2), FloatParam("maxHeightInsetRatio", 1.1, 0, 2), IntParam("minLayerJitter", 2), IntParam("maxLayerJitter", 5), IntParam("layerOffsetSize", 5)]), x0$);
  function IslandGenerator(){
    this.params = IslandGenerator.PARAMS.initialize();
    this.islets = [];
    this.layers = [];
  }
  prototype.generateIslet = function(rng){
    var minMul, maxMul, cx, cy, maxRadius, minRadius, nPoints, points, aspect, angle, rotate, p, i, xRadius, yRadius, ref$, x, y;
    minMul = 0.5 - this.params.isletSpread;
    maxMul = 0.5 + this.params.isletSpread;
    cx = rng.uniform(width * minMul, width * maxMul);
    cy = rng.uniform(height * minMul, height * maxMul);
    maxRadius = rng.uniform(Math.min(width, height) * this.params.isletMinRadius, Math.min(width, height) * this.params.isletMaxRadius);
    minRadius = maxRadius - maxRadius * this.params.isletJagginess;
    nPoints = rng.uniformInt(this.params.isletMinPoints, this.params.isletMaxPoints);
    points = [];
    aspect = rng.uniform(this.params.isletMinAspect, this.params.isletMaxAspect);
    angle = rng.uniform(this.params.isletMinAngle, this.params.isletMaxAngle) * PI2;
    rotate = makeRotator(angle);
    for (p = 0; p < nPoints; ++p) {
      i = p / nPoints;
      xRadius = rng.uniform(minRadius, maxRadius);
      yRadius = rng.uniform(minRadius, maxRadius);
      if (!this.params.isletSeparateRadii) {
        xRadius = yRadius = (xRadius + yRadius) * 0.5;
      }
      xRadius /= aspect;
      yRadius *= aspect;
      ref$ = rotate(Math.cos(i * PI2) * xRadius, Math.sin(i * PI2) * yRadius), x = ref$[0], y = ref$[1];
      points.push([cx + x, cy + y]);
    }
    points.negative = rng.uniform(0, 1) <= this.params.isletNegativeChance;
    return points;
  };
  prototype.convertIsletsToLayers = function(rng, islets){
    var layers, positiveIslets, negativeIslets, i$, ref$, len$, isletPoly, j$, ref1$, len1$, layer, openLayers, maxHeight, heightIncrease, offsetValue, layerJitter, newLayers, res$, k$, len2$, newLayer, layerXOffset, layerYOffset;
    layers = [];
    positiveIslets = islets.filter(function(islet){
      return !islet.negative;
    });
    negativeIslets = islets.filter(function(islet){
      return islet.negative;
    });
    islets = cut(positiveIslets, negativeIslets);
    for (i$ = 0, len$ = (ref$ = merge(islets)).length; i$ < len$; ++i$) {
      isletPoly = ref$[i$];
      for (j$ = 0, len1$ = (ref1$ = outsetPoly(isletPoly, this.params.islandInitialOutset)).length; j$ < len1$; ++j$) {
        layer = ref1$[j$];
        layer.height = 0;
        layers.push(layer);
      }
    }
    openLayers = [].concat(layers);
    this.maxHeight = maxHeight = rng.uniformInt(200, 400);
    while (openLayers.length) {
      layer = openLayers.shift();
      if (rng.uniform(0, 1) < 0.05) {
        console.log("skipping layer");
        continue;
      }
      if (layer.height > maxHeight) {
        console.log("maxheight " + maxHeight + " reached");
        break;
      }
      heightIncrease = rng.uniformInt(this.params.minHeightIncrease, this.params.maxHeightIncrease);
      offsetValue = rng.uniform(this.params.minHeightInsetRatio, this.params.maxHeightInsetRatio) * heightIncrease;
      layerJitter = rng.uniform(this.params.minLayerJitter, this.params.maxLayerJitter);
      newLayers = outsetPoly(layer, -offsetValue);
      if (newLayers.length) {
        res$ = [];
        for (k$ = 0, len2$ = newLayers.length; k$ < len2$; ++k$) {
          newLayer = newLayers[k$];
          layerXOffset = rng.uniform(-this.params.layerOffsetSize, this.params.layerOffsetSize);
          layerYOffset = rng.uniform(-this.params.layerOffsetSize, this.params.layerOffsetSize);
          newLayer = jitterPoly(rng, newLayer, layerJitter, layerJitter);
          newLayer = offsetPoly(newLayer, layerXOffset, layerYOffset);
          newLayer.height = layer.height + heightIncrease;
          res$.push(newLayer);
        }
        newLayers = res$;
        openLayers = openLayers.concat(newLayers);
        layers = layers.concat(newLayers);
      } else {
        console.log("no new layers");
      }
    }
    return layers;
  };
  prototype.generate = function(){
    var time, isletRng, nIslets, islets, x, layerRng;
    time = +new Date();
    this.rngFarm = new RandomFarm(this.params.seed);
    isletRng = this.rngFarm.get("islet");
    nIslets = isletRng.uniformInt(this.params.isletMinN, this.params.isletMaxN);
    this.islets = islets = (function(){
      var to$, results$ = [];
      for (x = 0, to$ = nIslets; x < to$; ++x) {
        results$.push(this.generateIslet(isletRng));
      }
      return results$;
    }.call(this));
    layerRng = this.rngFarm.get("layer");
    this.layers = this.convertIsletsToLayers(layerRng, islets);
    return this.genTime = (+new Date()) - time;
  };
  prototype.draw = function(){
    var svg, x1$, colorMap, x2$, i$, ref$, len$, layer, cOffset, color, outline, poly, blur, j$, x3$, ref1$, len1$, results$ = [];
    if (!(svg = this.svg)) {
      svg = SVG(document.body);
      svg.size(width, height);
      this.svg = svg;
    }
    svg.clear();
    if (this.params.bwColorMap) {
      svg.rect(width, height).fill('#000000');
      x1$ = colorMap = new Gradient();
      x1$.addPoint('#222222', 0);
      x1$.addPoint('#ffffff', 1);
    } else {
      svg.rect(width, height).fill('#53BEFF');
      x2$ = colorMap = new Gradient();
      x2$.addPoint('#94bf8b', 0);
      x2$.addPoint('#acd0a5', 0.2);
      x2$.addPoint('#bdcc96', 0.5);
      x2$.addPoint('#efebc0', 0.8);
      x2$.addPoint('#cab982', 0.99);
      x2$.addPoint('#cab982', 1.0);
    }
    for (i$ = 0, len$ = (ref$ = this.layers).length; i$ < len$; ++i$) {
      layer = ref$[i$];
      cOffset = layer.height / this.maxHeight;
      color = colorMap.getColor(cOffset);
      outline = layer.height == 0 ? 'black' : 'rgba(0,0,0,0.2)';
      poly = svg.polygon(layer).fill(color);
      if (this.params.contourOutlines) {
        poly.stroke({
          width: 1,
          color: outline
        });
      }
      if (blur = this.params.blurContours) {
        poly.filter(fn$);
      }
    }
    if (this.params.isletOutlines) {
      for (j$ = 0, len1$ = (ref1$ = this.islets).length; j$ < len1$; ++j$) {
        x3$ = ref1$[j$];
        results$.push(svg.polygon(x3$).stroke({
          width: 1,
          color: x3$.negative ? 'red' : 'white'
        }).fill('none'));
      }
      return results$;
    }
    function fn$(it){
      return it.gaussianBlur(blur);
    }
  };
  prototype.regenerateAndDraw = function(){
    this.generate();
    this.draw();
    return console.log("generated in " + this.genTime + " ms");
  };
  return IslandGenerator;
}());
makeUI = function(ig){
  var debouncedGenerate, gui, i$, ref$, len$, group, folder, j$, ref1$, len1$, param, guiParam;
  debouncedGenerate = _.debounce(function(){
    return ig.regenerateAndDraw();
  }, 50);
  gui = new dat.GUI();
  for (i$ = 0, len$ = (ref$ = IslandGenerator.PARAMS.groups).length; i$ < len$; ++i$) {
    group = ref$[i$];
    if (group.name) {
      folder = gui.addFolder(group.name);
    } else {
      folder = gui;
    }
    for (j$ = 0, len1$ = (ref1$ = group.params).length; j$ < len1$; ++j$) {
      param = ref1$[j$];
      guiParam = null;
      if (param.type == 'int') {
        guiParam = folder.add(ig.params, param.name, param.min, param.max).step(1);
      } else if (param.type == 'float') {
        guiParam = folder.add(ig.params, param.name, param.min, param.max);
      } else if (param.type == 'bool') {
        guiParam = folder.add(ig.params, param.name);
      } else if (param.type == "string") {
        guiParam = folder.add(ig.params, param.name);
      }
      guiParam.onChange(debouncedGenerate);
    }
  }
  ig.gui = gui;
};
main = function(){
  var ig;
  window.ig = ig = new IslandGenerator("dkkkhurf a der3");
  makeUI(ig);
  ig.regenerateAndDraw();
};
main();