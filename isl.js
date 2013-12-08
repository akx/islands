var PI2, width, height, rand, randint, Gradient, generateIslet, poly2clipper, clipper2poly, merge, offset, jitter, main;
PI2 = Math.PI * 2;
width = 700;
height = 700;
rand = function(a, b){
  return a + Math.random() * (b - a);
};
randint = function(a, b){
  return 0 | a + Math.random() * (b - a);
};
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
    var ref$, offset, data;
    if (!this.bitmap) {
      this.bitmap = this.render();
    }
    point = (ref$ = 0 > point ? 0 : point) < 1 ? ref$ : 1;
    offset = (0 | point * this.bitmap.width) * 4;
    data = this.bitmap.data;
    return "rgb(" + data[offset] + ", " + data[offset + 1] + ", " + data[offset + 2] + ")";
  };
  prototype.render = function(){
    var canvas, ctx, gradient, i$, ref$, len$, ref1$, color, point;
    canvas = document.createElement("canvas");
    canvas.width = this.resolution;
    canvas.height = 10;
    console.log(this.points);
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
generateIslet = function(){
  var cx, cy, maxRadius, radius, nPoints, points, p, i, xRadius, yRadius, x, y;
  cx = rand(width * 0.2, width * 0.8);
  cy = rand(height * 0.2, height * 0.8);
  maxRadius = Math.min(width, height) * 0.2;
  radius = rand(maxRadius * 0.3, maxRadius);
  nPoints = randint(7, 25);
  return points = (function(){
    var to$, results$ = [];
    for (p = 0, to$ = nPoints; p < to$; ++p) {
      i = p / nPoints;
      xRadius = rand(radius * 0.7, radius);
      yRadius = rand(radius * 0.7, radius);
      x = cx + Math.cos(i * PI2) * xRadius;
      y = cy + Math.sin(i * PI2) * yRadius;
      results$.push([x, y]);
    }
    return results$;
  }());
};
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
  return clipper2poly(cleanedPolygons[0]);
};
jitter = function(poly, ix, iy){
  var i$, len$, ref$, x, y, results$ = [];
  for (i$ = 0, len$ = poly.length; i$ < len$; ++i$) {
    ref$ = poly[i$], x = ref$[0], y = ref$[1];
    results$.push([x + rand(-ix, ix), y + rand(-iy, iy)]);
  }
  return results$;
};
main = function(){
  var svg, x0$, topoColorMap, x1$, bwColorMap, colorMap, islets, res$, x, outline, heightLines, n, lastHeightLine, nextHeightLine, maxHeight, i, len$, heightLine, cOffset, color, results$ = [];
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
  res$ = [];
  for (x = 0; x < 15; ++x) {
    res$.push(generateIslet());
  }
  islets = res$;
  outline = offset(merge(islets), 10);
  outline.height = 0;
  heightLines = [outline];
  for (x = 0; x < 7; ++x) {
    n = -randint(10, 30);
    lastHeightLine = heightLines[heightLines.length - 1];
    nextHeightLine = offset(lastHeightLine, n);
    if (!nextHeightLine.length) {
      break;
    }
    nextHeightLine = jitter(nextHeightLine, 3, 3);
    nextHeightLine.height = lastHeightLine.height + Math.abs(n);
    heightLines.push(nextHeightLine);
  }
  maxHeight = heightLines[heightLines.length - 1].height;
  for (i = 0, len$ = heightLines.length; i < len$; ++i) {
    heightLine = heightLines[i];
    cOffset = heightLine.height / maxHeight;
    console.log(cOffset);
    color = colorMap.getColor(cOffset);
    results$.push(svg.polygon(heightLine).stroke({
      width: 1,
      color: i == 0 ? 'black' : 'silver'
    }).fill(color));
  }
  return results$;
};
main();