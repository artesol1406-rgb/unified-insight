import { DIMS, type Vec } from "@/lib/amalgam/engine";

interface Props {
  vec: Vec;
  size?: number;
  color?: string;
}

export function SignatureChart({ vec, size = 320, color = "#ffcf7d" }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const n = DIMS.length;
  const ang = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, v: number) => {
    const a = ang(i);
    return `${cx + Math.cos(a) * r * v},${cy + Math.sin(a) * r * v}`;
  };
  const poly = DIMS.map((d, i) => pt(i, vec[d])).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      {/* rings */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon
          key={i}
          points={DIMS.map((_, j) => `${cx + Math.cos(ang(j)) * r * f},${cy + Math.sin(ang(j)) * r * f}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
      ))}
      {/* spokes */}
      {DIMS.map((d, i) => (
        <line
          key={d}
          x1={cx} y1={cy}
          x2={cx + Math.cos(ang(i)) * r}
          y2={cy + Math.sin(ang(i)) * r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />
      ))}
      {/* signature polygon — chromatic aberration */}
      <polygon points={poly} fill={`${color}1f`} stroke={color} strokeWidth="1.5" />
      <polygon points={poly} fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.4" transform={`translate(-1.2,0)`} />
      <polygon points={poly} fill="none" stroke="#ff00ea" strokeWidth="0.5" opacity="0.4" transform={`translate(1.2,0)`} />
      {/* labels */}
      {DIMS.map((d, i) => (
        <text
          key={d}
          x={cx + Math.cos(ang(i)) * (r + 16)}
          y={cy + Math.sin(ang(i)) * (r + 16)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={vec[d] > 0.45 ? color : "rgba(255,255,255,0.4)"}
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}
