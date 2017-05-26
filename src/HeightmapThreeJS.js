/* eslint-env browser */
import 'three/src/polyfills';
import { AxisHelper } from 'three/src/helpers/AxisHelper';
import { Color } from 'three/src/math/Color';
import { Mesh } from 'three/src/objects/Mesh';
import { MeshLambertMaterial } from 'three/src/materials/MeshLambertMaterial';
import { MeshPhongMaterial } from 'three/src/materials/MeshPhongMaterial';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry';
import { PointLight } from 'three/src/lights/PointLight';
import { Scene } from 'three/src/scenes/Scene';
import { VertexColors } from 'three/src/constants';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';

function clampColor(a) {
  if (a < 0) {
    return 0;
  }
  if (a >= 255) {
    return 255;
  }
  return Math.round(a);
}

class ThreePlaneWrapper {
  constructor(heightmap, resX, resY, heightScale = 1) {
    this.heightmap = heightmap;
    this.resX = resX;
    this.resY = resY;
    this.heightScale = heightScale;
    this.geometry = new PlaneGeometry(100, 100, this.resX, this.resY);
  }

  sample(x, y) {
    x /= this.resX;
    y /= this.resY;
    x *= this.heightmap.mapWidth;
    y *= this.heightmap.mapHeight;
    x = Math.floor(x);
    y = Math.floor(y);
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
  }

  update() {
    for (let y = 0; y < this.resX; ++y) {
      for (let x = 0; x < this.resY; ++x) {
        const z = this.sample(x, y);
        const o = y * (this.resX + 1) + x;
        this.geometry.vertices[o].z = z;
      }
    }
    let max = 0;
    const { vertices, faces } = this.geometry;
    vertices.forEach((vertex) => {
      if (vertex.z > max) max = vertex.z;
    });

    const faceIndices = ['a', 'b', 'c'];
    faces.forEach((face) => {
      for (let vi = 0; vi < 3; ++vi) {
        const v = vertices[face[faceIndices[vi]]];
        const height = v.z / max;
        const val = clampColor(Math.round(height * 255));
        face.vertexColors[vi] = new Color((val << 16) | (val << 8) | val); // eslint-disable-line
      }
    });
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
    this.geometry.verticesNeedUpdate = true;
    this.geometry.colorsNeedUpdate = true;
    return this.geometry;
  }
}

export default class HeightmapThreeJS {
  constructor(heightmap, width = 640, height = 480) {
    this.heightmap = heightmap;
    const viewAngle = 60;
    const aspect = width / height;
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xFFFFFF);
    renderer.setSize(width, height);
    this.renderer = renderer;
    document.body.appendChild(renderer.domElement);
    this.camera = new PerspectiveCamera(viewAngle, aspect, 0.1, 1000);
    this.pointLight = new PointLight(0xFFFFFF);
    this.sea = new Mesh(
      new PlaneGeometry(100, 100, 3, 3),
      new MeshLambertMaterial({ color: 0x53BEFF }),
    );
    this.sea.rotation.x = Math.PI * -0.5;
    const scene = new Scene();
    scene.add(this.camera);
    scene.add(this.pointLight);
    scene.add(this.sea);
    scene.add(new AxisHelper(10));
    this.scene = scene;
  }

  updateMesh() {
    const material = new MeshPhongMaterial({
      color: 0xFFFFFF,
      vertexColors: VertexColors,
    });
    const tpw = new ThreePlaneWrapper(this.heightmap, 64, 64, 0.1);
    const geometry = tpw.update();
    const plane = new Mesh(geometry, material);
    if (this.plane) {
      this.scene.remove(this.plane);
      this.plane = null;
    }
    this.plane = plane;
    this.plane.rotation.x = Math.PI * -0.5;
    this.scene.add(plane);
  }

  render() {
    const ang = +new Date() * -0.0005;
    const c = Math.cos(ang) * 50;
    const s = Math.sin(ang) * 50;
    this.camera.position.x = c;
    this.camera.position.y = 50;
    this.camera.position.z = s;
    this.camera.lookAt(this.scene.position);
    this.pointLight.position.x = 15;
    this.pointLight.position.y = 60;
    this.pointLight.position.z = 15;
    this.renderer.render(this.scene, this.camera);
  }
}

