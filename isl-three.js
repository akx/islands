var TerrainGeometry, HeightmapThreeJS;
TerrainGeometry = function(width, height, widthSegments, heightSegments, data, scale){
  var width_half, height_half, gridX, gridZ, gridX1, gridZ1, segment_width, segment_height, normal, iz, ix, x, y, z, a, b, c, d, uva, uvb, uvc, uvd, face;
  scale == null && (scale = 1);
  THREE.Geometry.call(this);
  this.width = width;
  this.height = height;
  this.widthSegments = widthSegments || 1;
  this.heightSegments = heightSegments || 1;
  width_half = width / 2;
  height_half = height / 2;
  gridX = this.widthSegments;
  gridZ = this.heightSegments;
  gridX1 = gridX + 1;
  gridZ1 = gridZ + 1;
  segment_width = this.width / gridX;
  segment_height = this.height / gridZ;
  normal = new THREE.Vector3(0, 1, 0);
  for (iz = 0; iz < gridZ1; ++iz) {
    for (ix = 0; ix < gridX1; ++ix) {
      x = ix * segment_width - width_half;
      y = iz * segment_height - height_half;
      if ((0 <= ix && ix < gridX) && (0 <= iz && iz < gridZ)) {
        z = data[iz * widthSegments + ix] * scale;
      } else {
        z = 0;
      }
      this.vertices.push(new THREE.Vector3(x, z, y));
    }
  }
  for (iz = 0; iz < gridZ; ++iz) {
    for (ix = 0; ix < gridX; ++ix) {
      z = data[iz * widthSegments + ix];
      if (z <= 0) {
        continue;
      }
      a = ix + gridX1 * iz;
      b = ix + gridX1 * (iz + 1);
      c = (ix + 1) + gridX1 * (iz + 1);
      d = (ix + 1) + gridX1 * iz;
      uva = new THREE.Vector2(ix / gridX, 1 - iz / gridZ);
      uvb = new THREE.Vector2(ix / gridX, 1 - (iz + 1) / gridZ);
      uvc = new THREE.Vector2((ix + 1) / gridX, 1 - (iz + 1) / gridZ);
      uvd = new THREE.Vector2((ix + 1) / gridX, 1 - iz / gridZ);
      face = new THREE.Face3(a, b, d);
      face.normal.copy(normal);
      face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
      this.faces.push(face);
      this.faceVertexUvs[0].push([uva, uvb, uvd]);
      face = new THREE.Face3(b, c, d);
      face.normal.copy(normal);
      face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
      this.faces.push(face);
      this.faceVertexUvs[0].push([uvb.clone(), uvc, uvd.clone()]);
    }
  }
  console.log(this);
  return this.computeCentroids();
};
TerrainGeometry.prototype = Object.create(THREE.Geometry.prototype);
HeightmapThreeJS = (function(){
  HeightmapThreeJS.displayName = 'HeightmapThreeJS';
  var prototype = HeightmapThreeJS.prototype, constructor = HeightmapThreeJS;
  function HeightmapThreeJS(heightmap){
    var WIDTH, HEIGHT, VIEW_ANGLE, ASPECT, x0$, geometry, material, x1$;
    this.heightmap = heightmap;
    WIDTH = 640;
    HEIGHT = 480;
    VIEW_ANGLE = 60;
    ASPECT = WIDTH / HEIGHT;
    x0$ = this.renderer = new THREE.WebGLRenderer();
    x0$.setSize(WIDTH, HEIGHT);
    document.body.appendChild(x0$.domElement);
    this.camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 1000);
    geometry = new THREE.Geometry();
    material = new THREE.MeshLambertMaterial({
      color: 0xFFCC00
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.pointLight = new THREE.PointLight(0xFFFFFF);
    x1$ = this.scene = new THREE.Scene();
    x1$.add(this.camera);
    x1$.add(this.plane);
    x1$.add(this.pointLight);
  }
  prototype.updateMesh = function(){
    this.plane.geometry = new TerrainGeometry(50, 50, this.heightmap.mapWidth, this.heightmap.mapHeight, this.heightmap.heightmapData, 0.1);
    this.plane.geometry.verticesNeedUpdate = true;
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