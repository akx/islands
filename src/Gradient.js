/* eslint-env browser */
export default class Gradient {
  constructor(resolution = 512) {
    this.resolution = resolution;
    this.points = [];
    this.bitmap = null;
  }

  addPoint(color, point) {
    this.points.push({ color, point });
    this.bitmap = null;
  }

  getColor(point) {
    if (!this.bitmap) this.bitmap = this.render();
    point = Math.min(Math.max(0, point), 1);
    const offset = Math.floor(point * this.bitmap.width) * 4;
    const { data } = this.bitmap;
    return `rgb(${data[offset]}, ${data[offset + 1]}, ${data[offset + 2]})`;
  }

  render() {
    const canvas = document.createElement('canvas');
    canvas.width = this.resolution;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    this.points.forEach(({ color, point }) => gradient.addColorStop(point, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}
