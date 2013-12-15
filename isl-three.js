var TerrainGeometry, HeightmapThreeJS;
TerrainGeometry = function(xRes, yRes, data, dataWidth, dataHeight, heightScale){
  var sample, vtxOff, vtxTable, y, x, z, to$, to1$, vo1, vo2, vo3, vo4, v1, v2, v3, v4, face;
  heightScale == null && (heightScale = 1);
  THREE.Geometry.call(this);
  sample = function(segX, segY){
    var dataX, dataY, ref$, ref1$, ref2$, ref3$;
    dataX = 0 | Math.round(segX / xRes * dataWidth);
    dataY = 0 | Math.round(segY / yRes * dataHeight);
    dataX = (ref$ = 0 > dataX ? 0 : dataX) > (ref1$ = dataWidth - 1) ? ref$ : ref1$;
    dataY = (ref2$ = 0 > dataY ? 0 : dataY) > (ref3$ = dataHeight - 1) ? ref2$ : ref3$;
    return data[dataY * dataWidth + dataX];
  };
  vtxOff = function(segX, segY){
    return (0 | segY) << 16 + (0 | segX);
  };
  vtxTable = {};
  for (y = 0; y <= yRes; ++y) {
    for (x = 0; x <= xRes; ++x) {
      z = sample(x, y) * heightScale;
      vtxTable[vtxOff(x, y)] = this.vertices.length;
      this.vertices.push(new THREE.Vector3(x, z, y));
    }
  }
  for (y = 0, to$ = yRes - 1; y < to$; ++y) {
    for (x = 0, to1$ = xRes - 1; x < to1$; ++x) {
      vo1 = vtxTable[vtxOff(x, y)];
      vo2 = vtxTable[vtxOff(x + 1, y)];
      vo3 = vtxTable[vtxOff(x + 1, y + 1)];
      vo4 = vtxTable[vtxOff(x, y + 1)];
      v1 = this.vertices[vo1];
      v2 = this.vertices[vo2];
      v3 = this.vertices[vo3];
      v4 = this.vertices[vo4];
      if (v1.z < 0 || !(v1 && v2 && v3 && v4)) {
        continue;
      }
      face = new THREE.Face3(vo1, vo2, vo4);
      face.normal = new THREE.Vector3(0, 1, 0);
      this.faces.push(face);
      face = new THREE.Face3(vo2, vo3, vo4);
      face.normal = new THREE.Vector3(0, 1, 0);
      this.faces.push(face);
    }
  }
  return this.computeCentroids();
};
TerrainGeometry.prototype = Object.create(THREE.Geometry.prototype);
HeightmapThreeJS = (function(){
  HeightmapThreeJS.displayName = 'HeightmapThreeJS';
  var prototype = HeightmapThreeJS.prototype, constructor = HeightmapThreeJS;
  function HeightmapThreeJS(heightmap){
    var WIDTH, HEIGHT, VIEW_ANGLE, ASPECT, x0$, x1$;
    this.heightmap = heightmap;
    WIDTH = 640;
    HEIGHT = 480;
    VIEW_ANGLE = 60;
    ASPECT = WIDTH / HEIGHT;
    x0$ = this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    x0$.setClearColor(0xFFFFFF);
    x0$.setSize(WIDTH, HEIGHT);
    document.body.appendChild(x0$.domElement);
    this.camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 1000);
    this.pointLight = new THREE.PointLight(0xFFFFFF);
    x1$ = this.scene = new THREE.Scene();
    x1$.add(this.camera);
    x1$.add(this.pointLight);
    x1$.add(new THREE.AxisHelper(10));
    x1$.add(new THREE.GridHelper(100, 5));
  }
  prototype.updateMesh = function(){
    var material, geometry, plane;
    material = new THREE.MeshLambertMaterial({
      color: 0x5B8F50,
      shading: THREE.FlatShading,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide
    });
    geometry = new TerrainGeometry(32, 32, this.heightmap.heightmapData, this.heightmap.mapWidth, this.heightmap.mapHeight, 0.1);
    geometry.verticesNeedUpdate = true;
    plane = new THREE.Mesh(geometry, material);
    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane = null;
    }
    this.plane = plane;
  };
  prototype.render = function(){
    var ang, c, s, p, ref$;
    ang = +new Date() * -0.0005;
    c = Math.cos(ang) * 50;
    s = Math.sin(ang) * 50;
    p = this.camera.position = new THREE.Vector3(c, 50, s);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    ref$ = this.pointLight.position;
    ref$.x = p.x - 10;
    ref$.y = p.y;
    ref$.z = p.z - 10;
    this.renderer.render(this.scene, this.camera);
  };
  return HeightmapThreeJS;
}());