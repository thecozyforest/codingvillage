/* ==========================================================
   꽃 도감
   꽃 하나 = 「회전한 타원」 목록입니다. 타원만 쓰는 이유는
   화면(SVG <ellipse>)과 내려받는 카드(canvas ctx.ellipse)가
   같은 정의에서 똑같이 그려져야 하기 때문입니다.
   그림을 두 번 그리면 반드시 어긋납니다.

   좌표는 꽃송이 중심이 (0,0), 반지름 1인 단위 공간입니다.
   실제 크기는 그리는 쪽에서 곱합니다.
   ========================================================== */

export type Petal = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** 라디안 */
  rot: number;
  fill: string;
  op?: number;
};

export type Flower = {
  id: string;
  name: string;
  /** 꽃집에서 고를 때 보이는 한 줄 */
  word: string;
  /** 줄기 색 */
  stem: string;
  shapes: Petal[];
};

const ring = (
  n: number,
  r: number,
  rx: number,
  ry: number,
  fill: string,
  offset = 0,
  op?: number
): Petal[] =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { cx: Math.cos(a) * r, cy: Math.sin(a) * r, rx, ry, rot: a, fill, op };
  });

const dot = (cx: number, cy: number, r: number, fill: string, op?: number): Petal => ({
  cx,
  cy,
  rx: r,
  ry: r,
  rot: 0,
  fill,
  op,
});

export const FLOWERS: Flower[] = [
  {
    id: "daisy",
    name: "데이지",
    word: "고마워요",
    stem: "#5d9c4a",
    shapes: [
      ...ring(12, 0.58, 0.44, 0.19, "#ffffff"),
      ...ring(12, 0.58, 0.44, 0.19, "#e9eef0", 0.26, 0.35),
      dot(0, 0, 0.3, "#f6c343"),
      dot(-0.07, -0.07, 0.13, "#ffdc7a", 0.9),
    ],
  },
  {
    id: "cosmos",
    name: "코스모스",
    word: "잘 어울려요",
    stem: "#5d9c4a",
    shapes: [
      ...ring(8, 0.6, 0.46, 0.27, "#f492b0"),
      ...ring(8, 0.62, 0.28, 0.12, "#e4739a", 0, 0.55),
      dot(0, 0, 0.24, "#ffd166"),
    ],
  },
  {
    id: "sunflower",
    name: "해바라기",
    word: "빛나요",
    stem: "#4f8b3d",
    shapes: [
      ...ring(16, 0.66, 0.42, 0.16, "#f7b733"),
      ...ring(16, 0.62, 0.3, 0.11, "#f59f1a", 0.19, 0.7),
      dot(0, 0, 0.36, "#6b4423"),
      dot(0, 0, 0.28, "#8a5a2b", 0.85),
      dot(-0.08, -0.08, 0.09, "#a97243", 0.6),
    ],
  },
  {
    id: "tulip",
    name: "튤립",
    word: "응원해요",
    stem: "#4f8b3d",
    shapes: [
      { cx: -0.26, cy: 0.02, rx: 0.3, ry: 0.55, rot: -0.28, fill: "#e2607a" },
      { cx: 0.26, cy: 0.02, rx: 0.3, ry: 0.55, rot: 0.28, fill: "#e2607a" },
      { cx: 0, cy: -0.04, rx: 0.33, ry: 0.6, rot: 0, fill: "#ef7d94" },
      { cx: 0, cy: -0.22, rx: 0.14, ry: 0.2, rot: 0, fill: "#f7a3b4", op: 0.8 },
    ],
  },
  {
    id: "rose",
    name: "장미",
    word: "고생했어요",
    stem: "#3f7a35",
    shapes: [
      ...ring(7, 0.55, 0.42, 0.34, "#d9536b"),
      ...ring(5, 0.34, 0.3, 0.26, "#e56b81", 0.4),
      ...ring(4, 0.18, 0.2, 0.18, "#ee879a", 0.8),
      dot(0, 0, 0.12, "#f6a7b5"),
    ],
  },
  {
    id: "forget",
    name: "물망초",
    word: "기억할게요",
    stem: "#5d9c4a",
    shapes: [
      ...ring(5, 0.5, 0.34, 0.32, "#7fb2e5"),
      ...ring(5, 0.5, 0.2, 0.18, "#a6cbef", 0, 0.7),
      dot(0, 0, 0.2, "#ffe08a"),
    ],
  },
  {
    id: "hydrangea",
    name: "수국",
    word: "함께해요",
    stem: "#4f8b3d",
    shapes: [
      ...ring(4, 0.52, 0.3, 0.3, "#9d92d8"),
      ...ring(4, 0.52, 0.3, 0.3, "#b0a7e4", 0.78),
      ...ring(4, 0.26, 0.24, 0.24, "#8b7fd0", 0.4),
      dot(0, 0, 0.16, "#d7d1f2"),
    ],
  },
  {
    id: "baby",
    name: "안개꽃",
    word: "축하해요",
    stem: "#6aa85a",
    shapes: [
      dot(-0.5, -0.3, 0.22, "#ffffff"),
      dot(0.42, -0.42, 0.2, "#fbfbfa"),
      dot(0.5, 0.28, 0.22, "#ffffff"),
      dot(-0.38, 0.44, 0.19, "#f4f4f1"),
      dot(0, 0, 0.28, "#ffffff"),
      dot(-0.5, -0.3, 0.07, "#f0e2a8"),
      dot(0.5, 0.28, 0.07, "#f0e2a8"),
      dot(0, 0, 0.09, "#f0e2a8"),
    ],
  },
];

export const FLOWER_BY_ID: Record<string, Flower> = Object.fromEntries(
  FLOWERS.map((f) => [f.id, f])
);

export function flowerOf(id: string): Flower {
  return FLOWER_BY_ID[id] ?? FLOWERS[0];
}

/* ── 캔버스에 그리기 (카드 내려받기가 씁니다) ──
   화면의 SVG와 같은 shapes를 그대로 씁니다. */

export function drawFlowerHead(
  ctx: CanvasRenderingContext2D,
  flower: Flower,
  cx: number,
  cy: number,
  r: number
) {
  for (const s of flower.shapes) {
    ctx.save();
    ctx.globalAlpha = s.op ?? 1;
    ctx.fillStyle = s.fill;
    ctx.beginPath();
    ctx.ellipse(cx + s.cx * r, cy + s.cy * r, s.rx * r, s.ry * r, s.rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** 줄기와 잎까지 갖춘 한 송이. groundY 는 땅에 닿는 높이입니다. */
export function drawFlower(
  ctx: CanvasRenderingContext2D,
  flower: Flower,
  x: number,
  groundY: number,
  headR: number,
  stemLen: number
) {
  const headY = groundY - stemLen;

  ctx.save();
  ctx.strokeStyle = flower.stem;
  ctx.lineWidth = Math.max(1.5, headR * 0.15);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.quadraticCurveTo(x + headR * 0.22, groundY - stemLen * 0.55, x, headY + headR * 0.4);
  ctx.stroke();

  // 잎
  ctx.fillStyle = flower.stem;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(x - headR * 0.55, groundY - stemLen * 0.42, headR * 0.5, headR * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawFlowerHead(ctx, flower, x, headY, headR);
}
