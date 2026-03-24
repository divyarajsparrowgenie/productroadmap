import type { DependencyItem } from "@/hooks/useRoadmap";

export type RowPosition = {
  y: number;
  leftPx: number;
  rightPx: number;
};

interface Props {
  dependencies: DependencyItem[];
  rowPositions: Map<string, RowPosition>;
  containerWidth: number;
}

const DEP_COLORS: Record<string, string> = {
  blocks: "#ef4444",
  is_blocked_by: "#f97316",
  relates_to: "#94a3b8",
};

export default function DependencyArrows({ dependencies, rowPositions, containerWidth }: Props) {
  if (!dependencies.length || !containerWidth) return null;

  const arrows: React.ReactNode[] = [];

  for (const dep of dependencies) {
    const source = rowPositions.get(dep.source_id);
    const target = rowPositions.get(dep.target_id);
    if (!source || !target) continue;

    const color = DEP_COLORS[dep.dependency_type] ?? DEP_COLORS.relates_to;
    const sx = source.rightPx;
    const sy = source.y;
    const tx = target.leftPx;
    const ty = target.y;

    let path: string;
    if (tx > sx) {
      // Forward dependency: L-shaped bezier
      const mx = (sx + tx) / 2;
      path = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
    } else {
      // Backward dependency: loop around
      const offset = 20;
      path = `M ${sx} ${sy} C ${sx + offset} ${sy}, ${tx - offset} ${ty}, ${tx} ${ty}`;
    }

    arrows.push(
      <path
        key={dep.id}
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        markerEnd={`url(#arrow-${dep.dependency_type})`}
        opacity={0.7}
      />
    );
  }

  const height = Math.max(...Array.from(rowPositions.values()).map((r) => r.y), 0) + 40;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: containerWidth, height }}
      overflow="visible"
    >
      <defs>
        {Object.entries(DEP_COLORS).map(([type, color]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 6 3 L 0 6 z" fill={color} />
          </marker>
        ))}
      </defs>
      {arrows}
    </svg>
  );
}
