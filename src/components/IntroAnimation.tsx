import { useEffect, useRef, useState } from "react";

type Phase = "chaos" | "pair" | "triangle" | "square" | "pentagon" | "hexagon" | "bubbles" | "flower" | "done";

const PHASE_DURATIONS: Record<Phase, number> = {
  chaos: 1400,
  pair: 1400,
  triangle: 900,
  square: 800,
  pentagon: 800,
  hexagon: 800,
  bubbles: 1100,
  flower: 1800,
  done: 0,
};

const CYAN = "#00f5ff";
const MAGENTA = "#ff00ea";
const GOLD = "#ffcf7d";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  partnerColor: string;
  pairId: number;
}

const POLAR: Record<string, string> = { [CYAN]: MAGENTA, [MAGENTA]: CYAN };

// Flower of Life: 19 circle centers (1 center + 6 inner + 12 outer)
function flowerCenters(cx: number, cy: number, r: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [[cx, cy]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r * 2, cy + Math.sin(a) * r * 2]);
    const a2 = ((i + 0.5) / 6) * Math.PI * 2;
    pts.push([cx + Math.cos(a2) * r * Math.sqrt(3), cy + Math.sin(a2) * r * Math.sqrt(3)]);
  }
  return pts;
}

function polygonPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const COUNT = 64;
    const particles: Particle[] = [];
    for (let i = 0; i < COUNT; i++) {
      const color = i % 2 === 0 ? CYAN : MAGENTA;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        color,
        partnerColor: POLAR[color],
        pairId: Math.floor(i / 2),
      });
    }

    let phase: Phase = "chaos";
    let phaseStart = performance.now();
    let raf = 0;
    let stopped = false;

    const nextPhase: Record<Phase, Phase> = {
      chaos: "pair", pair: "triangle", triangle: "square",
      square: "pentagon", pentagon: "hexagon", hexagon: "bubbles",
      bubbles: "flower", flower: "done", done: "done",
    };

    const finish = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      setHidden(true);
      setTimeout(onDone, 400);
    };

    const skip = () => finish();
    window.addEventListener("click", skip);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === " ") skip(); };
    window.addEventListener("keydown", onKey);

    const draw = (now: number) => {
      const elapsed = now - phaseStart;
      const dur = PHASE_DURATIONS[phase];
      const t = Math.min(1, elapsed / Math.max(1, dur));

      // background gentle clear with trail
      ctx.fillStyle = "rgba(6, 7, 9, 0.35)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;
      const baseR = Math.min(w, h) * 0.11;

      if (phase === "chaos") {
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          drawParticle(ctx, p.x, p.y, 3, p.color);
        }
      } else if (phase === "pair") {
        // each pair: even particle attracts odd of polar color toward midpoint
        for (let i = 0; i < particles.length; i += 2) {
          const a = particles[i], b = particles[i + 1];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          a.x += (mx - a.x) * 0.04;
          a.y += (my - a.y) * 0.04;
          b.x += (mx - b.x) * 0.04;
          b.y += (my - b.y) * 0.04;
          drawLine(ctx, a.x, a.y, b.x, b.y, GOLD, 0.15 + t * 0.5);
          drawParticle(ctx, a.x, a.y, 3, a.color);
          drawParticle(ctx, b.x, b.y, 3, b.color);
        }
      } else if (phase === "triangle" || phase === "square" || phase === "pentagon" || phase === "hexagon") {
        const sides = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 }[phase];
        const polygons = Math.max(4, Math.floor(particles.length / sides));
        // Position polygons in a soft ring around center
        for (let i = 0; i < polygons; i++) {
          const a = (i / polygons) * Math.PI * 2;
          const dist = baseR * 2.2 * (1 - 0.5 * t);
          const px = cx + Math.cos(a) * dist;
          const py = cy + Math.sin(a) * dist;
          const r = baseR * (0.45 + 0.15 * t);
          // chromatic aberration: three offset strokes
          drawPolygon(ctx, px - 0.8, py, r, sides, CYAN, 0.6);
          drawPolygon(ctx, px + 0.8, py, r, sides, MAGENTA, 0.6);
          drawPolygon(ctx, px, py, r, sides, GOLD, 0.9);
        }
      } else if (phase === "bubbles") {
        // bubbles drift to flower centers
        const targets = flowerCenters(cx, cy, baseR * 1.1);
        for (let i = 0; i < particles.length; i++) {
          const tgt = targets[i % targets.length];
          const p = particles[i];
          p.x += (tgt[0] - p.x) * 0.08;
          p.y += (tgt[1] - p.y) * 0.08;
          const rad = 8 + Math.sin(now / 300 + i) * 1.5;
          drawBubble(ctx, p.x, p.y, rad, p.color);
        }
      } else if (phase === "flower") {
        const centers = flowerCenters(cx, cy, baseR * 1.1);
        const reveal = Math.min(1, t * 1.2);
        // crystalline holographic shimmer: draw 3 offset copies
        for (const [ox, oy, col, alpha] of [
          [-1.5, 0, CYAN, 0.55],
          [1.5, 0, MAGENTA, 0.55],
          [0, 0, GOLD, 0.95],
        ] as Array<[number, number, string, number]>) {
          ctx.strokeStyle = withAlpha(col, alpha * reveal);
          ctx.lineWidth = 1.1;
          for (let i = 0; i < centers.length; i++) {
            const [x, y] = centers[i];
            ctx.beginPath();
            ctx.arc(x + ox, y + oy, baseR * 1.1, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // outer crystalline polygons
        const shimmer = 0.5 + 0.5 * Math.sin(now / 400);
        polygonPath(ctx, cx, cy, baseR * 3.2, 6);
        ctx.strokeStyle = withAlpha(GOLD, 0.4 * reveal * shimmer);
        ctx.stroke();
        polygonPath(ctx, cx, cy, baseR * 3.2, 12, 0);
        ctx.strokeStyle = withAlpha(CYAN, 0.25 * reveal);
        ctx.stroke();
      }

      // central glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 4);
      grad.addColorStop(0, withAlpha(GOLD, 0.08));
      grad.addColorStop(1, "rgba(6,7,9,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (elapsed >= dur) {
        phase = nextPhase[phase];
        phaseStart = now;
        if (phase === "done") { finish(); return; }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background transition-opacity duration-500 ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-8 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted/60">
        Click or press Esc to skip
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen">
        <div className="font-display font-black text-3xl tracking-tighter text-foreground/0 animate-[pulse-shimmer_2s_ease-in-out_infinite]">
          1+1=3
        </div>
      </div>
    </div>
  );
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = withAlpha(color, 0.9);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha(color, 0.18);
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, alpha: number) {
  ctx.strokeStyle = withAlpha(color, alpha);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, color: string, alpha: number) {
  polygonPath(ctx, cx, cy, r, n);
  ctx.strokeStyle = withAlpha(color, alpha);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.strokeStyle = withAlpha(color, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = withAlpha(color, 0.06);
  ctx.fill();
}

function withAlpha(hex: string, a: number) {
  // hex like #rrggbb
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
