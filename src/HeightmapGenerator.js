/* eslint-env browser */
const { lerp, closestPointOnSegment, getSquaredDistance, getDistance } = require('./util');
const { rand } = require('./rand.js');

export default class HeightmapGenerator {
  constructor(ig, mapWidth, mapHeight) {
    this.ig = ig;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.scaleX = this.mapWidth / this.ig.width;
    this.scaleY = this.mapHeight / this.ig.height;
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = this.mapWidth;
    debugCanvas.height = this.mapHeight;
    debugCanvas.style.border = '1px solid red';
    debugCanvas.style.width = '500px';
    debugCanvas.style.height = '500px';
    document.body.appendChild(debugCanvas);
    this.debugCanvas = debugCanvas;

    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = this.mapWidth;
    scratchCanvas.height = this.mapHeight;
    scratchCanvas.style.border = '1px solid black';
    this.scratchCanvas = scratchCanvas;

    this.debugCtx = debugCanvas.getContext('2d');
    this.scratchCtx = scratchCanvas.getContext('2d');
    this.heightmapData = new Float32Array(mapWidth * mapHeight);
    this.segments = this.generateSegments();
    console.log(`${this.segments.length} segments.`);
  }

  generateSegments() {
    const segments = [];
    this.ig.layers.forEach((layer) => {
      const height = layer.height;
      for (let a = 0; a < layer.length; ++a) {
        const b = (a + 1) % layer.length;
        const pa = [layer[a][0] * this.scaleX, layer[a][1] * this.scaleY];
        const pb = [layer[b][0] * this.scaleX, layer[b][1] * this.scaleY];
        const seg = [pa, pb];
        seg.height = height;
        segments.push(seg);
      }
    });
    return segments;
  }

  updateDebugCanvas() {
    const max = Math.max.apply(null, this.heightmapData);
    const debugCtx = this.debugCtx;
    debugCtx.fillStyle = 'purple';
    debugCtx.fillRect(0, 0, this.mapWidth, this.mapHeight);
    const data = debugCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);
    for (let i = 0; i < this.heightmapData.length; ++i) {
      const height = this.heightmapData[i];
      if (height > 0) {
        const color = Math.floor(height / max * 255.0);
        data.data[i * 4 + 0] = color;
        data.data[i * 4 + 1] = color;
        data.data[i * 4 + 2] = color;
        data.data[i * 4 + 3] = 255;
      }
    }
    debugCtx.putImageData(data, 0, 0);
    debugCtx.fillStyle = 'white';
    debugCtx.fillText(`max = ${Math.floor(max)}`, 3, this.mapHeight - 3);
  }

  determineBaseRegion() {
    const sc = this.scratchCtx;
    sc.fillStyle = 'black';
    sc.fillRect(0, 0, this.mapWidth, this.mapHeight);
    sc.fillStyle = 'red';
    this.ig.layers.forEach((layer) => {
      if (layer.height > 0) {
        return;
      }
      sc.beginPath();
      layer.forEach(([x, y], i) => {
        x *= this.scaleX;
        y *= this.scaleY;
        if (i === 0) {
          sc.moveTo(x, y);
        } else {
          sc.lineTo(x, y);
        }
      });
      sc.closePath();
      sc.fill();
    });
    const data = sc.getImageData(0, 0, this.mapWidth, this.mapHeight);
    for (let i = 0, to$ = this.mapWidth * this.mapHeight; i < to$; ++i) {
      let off = i * 4;
      if (data.data[off] >= 250) {
        data.data[off++] = 255;
      } else {
        data.data[off++] = 0;
      }
      data.data[off++] = 0;
      data.data[off++] = 0;
      data.data[off++] = 255;
    }
    sc.putImageData(data, 0, 0);
  }

  startGenerate() {
    this.determineBaseRegion();
    this.updateDebugCanvas();
    this.y = 0;
  }

  generateNextLine() {
    if (this.y >= this.mapHeight) {
      return false;
    }
    this.generateLine(this.y);
    this.y++;
    return true;
  }

  generateLine(y) {
    const N_SAMPLES = 5;
    const SAMPLE_JITTER = 1;

    console.log(`generating line: ${y}`);
    const scratchData = this.scratchCtx.getImageData(0, y, this.mapWidth, 1).data;
    for (let x = 0; x < this.mapWidth; ++x) {
      const red = scratchData[x * 4];
      if (red === 255) {
        const dataOffset = y * this.mapWidth + x;
        let height = 0;
        for (let i = 0; i < N_SAMPLES; ++i) {
          height += this.generatePoint(x + rand(-SAMPLE_JITTER, +SAMPLE_JITTER), y + rand(-SAMPLE_JITTER, SAMPLE_JITTER));
        }
        this.heightmapData[dataOffset] = height / N_SAMPLES;
      }
    }
    this.updateDebugCanvas();
  }

  getSegmentDistances(x, y) {
    const distances = [];
    const xy = [x, y];
    this.segments.forEach((segment) => {
      const height = segment.height;
      const closestPt = closestPointOnSegment(xy, segment[0], segment[1]);
      const distanceSqr = getSquaredDistance(x, y, closestPt[0], closestPt[1]);
      distances.push({
        distance: distanceSqr,
        pt: closestPt,
        height,
      });
    });
    return distances.sort((a, b) => a.distance - b.distance);
  }

  generatePoint(x, y) {
    const distances = this.getSegmentDistances(x, y);
    const ds1 = distances[0];
    let ds2 = ds1;
    for (let i = 0; i < distances.length; ++i) {
      const distance = distances[i];
      if (distance.height !== ds1.height) {
        ds2 = distance;
        break;
      }
    }
    ds2 = ds2 || ds1;
    const pt1 = ds1.pt;
    const pt2 = ds2.pt;
    const cpd = closestPointOnSegment([x, y], pt1, pt2);
    const interpLength = getDistance(pt1[0], pt1[1], pt2[0], pt2[1]);
    const d1 = getDistance(cpd[0], cpd[1], pt1[0], pt1[1]);
    const interpAlpha = d1 / interpLength;
    return lerp(ds1.height, ds2.height, interpAlpha);
  }
}
