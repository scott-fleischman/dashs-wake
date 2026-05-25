import type { CubeShapeKind } from "../core/inventory";

interface Point {
  x: number;
  y: number;
}

function rotatedVerticalExtent(
  points: readonly Point[],
  rotation: number,
): number {
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);

  return Math.max(
    ...points.map((point) => Math.abs(point.x * sin + point.y * cos)),
  );
}

export function cubeGroundExtent(
  kind: CubeShapeKind,
  width: number,
  height: number,
  rotation: number,
): number {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  if (kind === "circle") {
    return Math.min(width, height) / 2;
  }

  if (kind === "diamond") {
    return rotatedVerticalExtent(
      [
        { x: 0, y: -halfHeight },
        { x: halfWidth, y: 0 },
        { x: 0, y: halfHeight },
        { x: -halfWidth, y: 0 },
      ],
      rotation,
    );
  }

  return rotatedVerticalExtent(
    [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ],
    rotation,
  );
}
