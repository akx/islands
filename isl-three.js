var ThreePlaneWrapper, HeightmapThreeJS;
ThreePlaneWrapper = (function(){
  ThreePlaneWrapper.displayName = 'ThreePlaneWrapper';
  var prototype = ThreePlaneWrapper.prototype, constructor = ThreePlaneWrapper;
  function ThreePlaneWrapper(heightmap, resX, resY, heightScale){
    this.heightmap = heightmap;
    this.resX = resX;
    this.resY = resY;
    this.heightScale = heightScale != null ? heightScale : 1;
    this.geometry = new THREE.PlaneGeometry(100, 100, this.resX, this.resY);
  }
  prototype.sample = function(x, y){
    x /= this.resX;
    y /= this.resY;
    x *= this.heightmap.mapWidth;
    y *= this.heightmap.mapHeight;
    x = 0 | x;
    y = 0 | y;
    if (x < 0 || x > this.heightmap.mapWidth) {
      return -1;
    }
    if (y < 0 || y > this.heightmap.mapHeight) {
      return -1;
    }
    y = this.heightmap.heightmapData[y * this.heightmap.mapWidth + x] * this.heightScale;
    if (y <= 0) {
      y = -1;
    }
    return y;
  };
  prototype.update = function(){
    var clampColor, y, to$, x, to1$, z, o, max, i$, x0$, ref$, len$, ref1$, j$, ref2$, len1$, face, vi, v, height, r, g, b, color;
    clampColor = function(a){
      if (a < 0) {
        return 0;
      }
      if (a >= 255) {
        return 255;
      }
      return 0 | a;
    };
    for (y = 0, to$ = this.resX; y < to$; ++y) {
      for (x = 0, to1$ = this.resY; x < to1$; ++x) {
        z = this.sample(x, y);
        o = y * (this.resX + 1) + x;
        this.geometry.vertices[o].z = z;
      }
    }
    max = 0;
    for (i$ = 0, len$ = (ref$ = this.geometry.vertices).length; i$ < len$; ++i$) {
      x0$ = ref$[i$];
      max = max > (ref1$ = x0$.z) ? max : ref1$;
    }
    for (j$ = 0, len1$ = (ref2$ = this.geometry.faces).length; j$ < len1$; ++j$) {
      face = ref2$[j$];
      for (vi = 0; vi < 3; ++vi) {
        v = this.geometry.vertices[face[['a', 'b', 'c'][vi]]];
        height = v.z / max;
        r = g = b = 0 | 255 * height;
        color = new THREE.Color(clampColor(r) << 16 | clampColor(g) << 8 | clampColor(b));
        face.vertexColors[vi] = color;
      }
    }
    this.geometry.computeCentroids();
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
    this.geometry.verticesNeedUpdate = true;
    this.geometry.colorsNeedUpdate = true;
    return this.geometry;
  };
  return ThreePlaneWrapper;
}());
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
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 3, 3), new THREE.MeshLambertMaterial({
      color: 0x53BEFF
    }));
    this.sea.rotation.x = Math.PI * -0.5;
    x1$ = this.scene = new THREE.Scene();
    x1$.add(this.camera);
    x1$.add(this.pointLight);
    x1$.add(this.sea);
    x1$.add(new THREE.AxisHelper(10));
  }
  prototype.updateMesh = function(){
    var material, tpw, geometry, plane;
    material = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      vertexColors: THREE.VertexColors
    });
    tpw = new ThreePlaneWrapper(this.heightmap, 64, 64, 0.1);
    geometry = tpw.update();
    plane = new THREE.Mesh(geometry, material);
    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane = null;
    }
    this.plane = plane;
    this.plane.rotation.x = Math.PI * -0.5;
    this.scene.add(plane);
  };
  prototype.render = function(){
    var ang, c, s, p, ref$;
    ang = +new Date() * -0.0005;
    c = Math.cos(ang) * 50;
    s = Math.sin(ang) * 50;
    p = this.camera.position = new THREE.Vector3(c, 50, s);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    ref$ = this.pointLight.position;
    ref$.x = 15;
    ref$.y = 60;
    ref$.z = 15;
    this.renderer.render(this.scene, this.camera);
  };
  return HeightmapThreeJS;
}());