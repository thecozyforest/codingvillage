"use client";

import { useEffect, useRef } from "react";
import type { Season } from "@/lib/village";

/* ==========================================================
   계절 공기 — 마을 위에 흩날리는 것들

   봄 꽃잎 · 여름 나뭇잎과 볕 · 가을 낙엽 · 겨울 눈.

   SVG로 수십 개를 움직이면 폰에서 버벅이므로 캔버스에 그립니다.
   전시장에서 아이들이 저사양 폰으로 들어오는 걸 전제로,
   개수를 적게 잡고 화면이 안 보이면 아예 멈춥니다.
   ========================================================== */

type Kind = "petal" | "leaf" | "snow";

type Spec = {
  kind: Kind;
  /** 넓은 화면 기준 개수. 좁은 화면에서는 절반으로 줄입니다. */
  count: number;
  colors: string[];
  size: [number, number];
  /** 초당 내려오는 픽셀 */
  fall: [number, number];
  /** 좌우로 흔들리는 폭 */
  sway: [number, number];
  spin: [number, number];
  /** 오른쪽 위에 볕을 깔지 */
  sun?: boolean;
};

const SPEC: Record<Season, Spec> = {
  봄: {
    kind: "petal",
    count: 16,
    colors: ["#f7c1d2", "#fadbe5", "#ffffff", "#f6b8c9"],
    size: [5, 10],
    fall: [16, 34],
    sway: [14, 34],
    spin: [0.4, 1.4],
  },
  여름: {
    kind: "leaf",
    count: 10,
    colors: ["#7cbb5e", "#9ed37f", "#c3e3a4"],
    size: [6, 12],
    fall: [22, 44],
    sway: [18, 40],
    spin: [0.6, 1.8],
    sun: true,
  },
  가을: {
    kind: "leaf",
    count: 18,
    colors: ["#d9772f", "#c2551d", "#c99a2e", "#a8551f", "#e0a24a"],
    size: [6, 13],
    fall: [26, 52],
    sway: [22, 48],
    spin: [0.8, 2.4],
  },
  겨울: {
    kind: "snow",
    count: 30,
    colors: ["#ffffff", "#eef4fc", "#dce8f8"],
    size: [2, 5.5],
    fall: [14, 32],
    sway: [8, 22],
    spin: [0, 0.2],
  },
};

type Bit = {
  x: number;
  y: number;
  r: number;
  color: string;
  fall: number;
  swayAmp: number;
  swayRate: number;
  phase: number;
  spin: number;
  angle: number;
};

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);

export function SeasonAir({ season }: { season: Season }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // 움직임을 줄이겠다고 설정한 사람에게는 아무것도 그리지 않습니다.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spec = SPEC[season];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let bits: Bit[] = [];

    const make = (seeded: boolean): Bit => ({
      x: Math.random() * w,
      // 처음 한 번은 화면 곳곳에서 시작해야 위에서 우수수 쏟아지지 않습니다.
      y: seeded ? Math.random() * h : -20,
      r: between(spec.size),
      color: spec.colors[Math.floor(Math.random() * spec.colors.length)],
      fall: between(spec.fall),
      swayAmp: between(spec.sway),
      swayRate: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      spin: between(spec.spin) * (Math.random() < 0.5 ? -1 : 1),
      angle: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = Math.round(spec.count * (w < 520 ? 0.5 : 1));
      bits = Array.from({ length: n }, () => make(true));
    };

    resize();
    window.addEventListener("resize", resize);

    const drawSun = () => {
      const g = ctx.createRadialGradient(w * 0.86, h * 0.1, 0, w * 0.86, h * 0.1, Math.max(w, h) * 0.42);
      g.addColorStop(0, "rgba(255, 236, 170, 0.5)");
      g.addColorStop(0.45, "rgba(255, 238, 190, 0.14)");
      g.addColorStop(1, "rgba(255, 240, 200, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const drawBit = (b: Bit) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = b.color;

      if (spec.kind === "snow") {
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (spec.kind === "petal") {
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r, b.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 잎 — 가운데 잎맥까지 그려야 잎처럼 보입니다.
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(-b.r, 0);
        ctx.quadraticCurveTo(0, -b.r * 0.75, b.r, 0);
        ctx.quadraticCurveTo(0, b.r * 0.75, -b.r, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(70, 55, 30, 0.28)";
        ctx.lineWidth = Math.max(0.6, b.r * 0.09);
        ctx.beginPath();
        ctx.moveTo(-b.r * 0.8, 0);
        ctx.lineTo(b.r * 0.8, 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // 탭을 다시 켰을 때 확 튀지 않게
      last = now;

      ctx.clearRect(0, 0, w, h);
      if (spec.sun) drawSun();

      for (const b of bits) {
        b.y += b.fall * dt;
        b.phase += b.swayRate * dt;
        b.x += Math.sin(b.phase) * b.swayAmp * dt;
        b.angle += b.spin * dt;

        if (b.y - b.r > h) {
          Object.assign(b, make(false));
          b.x = Math.random() * w;
        }
        if (b.x < -30) b.x = w + 20;
        if (b.x > w + 30) b.x = -20;

        drawBit(b);
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // 화면이 안 보이면 멈춥니다(전시장 태블릿의 배터리).
    const onVisible = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisible);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [season]);

  return <canvas ref={ref} className="cv-air" aria-hidden="true" />;
}
