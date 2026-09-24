import { Path } from 'three';

// Closed, rounded lanes: arc-length sampling keeps cars at a constant road speed.
export function cityLoop(halfWidth, halfDepth, radius) {
  const path = new Path();
  path.moveTo(-halfWidth + radius, -halfDepth);
  path.lineTo(halfWidth - radius, -halfDepth);
  path.absarc(halfWidth - radius, -halfDepth + radius, radius, -Math.PI / 2, 0, false);
  path.lineTo(halfWidth, halfDepth - radius);
  path.absarc(halfWidth - radius, halfDepth - radius, radius, 0, Math.PI / 2, false);
  path.lineTo(-halfWidth + radius, halfDepth);
  path.absarc(-halfWidth + radius, halfDepth - radius, radius, Math.PI / 2, Math.PI, false);
  path.lineTo(-halfWidth, -halfDepth + radius);
  path.absarc(-halfWidth + radius, -halfDepth + radius, radius, Math.PI, Math.PI * 1.5, false);
  path.arcLengthDivisions = 1200;
  path.updateArcLengths();
  return path;
}

export function trafficPose(path, elapsed, offset, speed, direction = 1) {
  const progress = ((offset + direction * elapsed * speed / path.getLength()) % 1 + 1) % 1;
  const point = path.getPointAt(progress);
  const tangent = path.getTangentAt(progress).multiplyScalar(direction);
  return { x: point.x, z: point.y, angle: Math.atan2(tangent.x, tangent.y) };
}
