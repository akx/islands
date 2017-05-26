export function lerp(a, b, alpha) {
  return b * alpha + a * (1 - alpha);
}

export function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

export function getSquaredDistance(x1, y1, x2, y2) {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

export function distToSegmentSquared(p, v, w) {
  const l2 = getSquaredDistance(v[0], v[1], w[0], w[1]);
  if (l2 <= 0) {
    return getSquaredDistance(p[0], p[1], v[0], v[1]);
  }
  const t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  if (t <= 0) {
    return getSquaredDistance(p[0], p[1], v[0], v[1]);
  }
  if (t >= 1) {
    return getSquaredDistance(p[0], p[1], w[0], w[1]);
  }
  return getSquaredDistance(p[0], p[1], v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1]));
}

export function distToSegment(p, v, w) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

export function closestPointOnSegment(p, v, w) {
  const l2 = getSquaredDistance(v[0], v[1], w[0], w[1]);
  if (l2 <= 0) {
    return p;
  }
  const t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  if (t <= 0) {
    return v;
  }
  if (t >= 1) {
    return w;
  }
  return [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])];
}
