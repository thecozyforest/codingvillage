import { drawFlower, flowerOf } from "./flowers";

/* ==========================================================
   마을 완주 카드

   도장을 다 찍은 사람이 가져가는 한 장입니다.
   이름과 날짜는 **넣고 싶은 사람만** 넣습니다 — 전시장에서 이름을
   적기 싫은 손님도 있고, 아이들 이름이 담긴 이미지가 돌아다니는 것도
   좋은 일이 아니라서 기본값을 「넣지 않음」으로 둡니다.
   ========================================================== */

const PAPER = "#fbf6ee";
const INK = "#4a3a30";
const SOFT = "#8a7768";
const RED = "#b8463f";
const WOOD = "#8b6743";

const HEAD = `"Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
const HAND = `"Gaegu", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
const BODY = `"Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function today() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

/** 도장 한 칸. 아직 안 들른 곳은 빈 자리로 남겨 둔다(그래야 도장판이 된다). */
function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  label: string,
  tilt: number,
  stamped: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);

  if (!stamped) {
    // 빈 자리 — 점선 동그라미와 흐린 이름
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#d9cdbb";
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.setLineDash([r * 0.16, r * 0.13]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#b3a692";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    writeLabel(ctx, label, r);
    ctx.restore();
    return;
  }

  ctx.rotate(tilt);
  ctx.globalAlpha = 0.88;

  ctx.strokeStyle = RED;
  ctx.lineWidth = r * 0.11;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.83, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = RED;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  writeLabel(ctx, label, r);
  ctx.restore();
}

/** 이름이 길면 띄어쓰기에서 두 줄로 나눈다(「마을 도서관」처럼). */
function writeLabel(ctx: CanvasRenderingContext2D, label: string, r: number) {
  const parts = label.split(" ");
  if (parts.length > 1 && label.length > 4) {
    ctx.font = `${r * 0.3}px ${HEAD}`;
    ctx.fillText(parts[0], 0, -r * 0.19);
    ctx.fillText(parts.slice(1).join(" "), 0, r * 0.21);
  } else if (label.length > 6) {
    ctx.font = `${r * 0.24}px ${HEAD}`;
    ctx.fillText(label, 0, 0);
  } else {
    ctx.font = `${r * 0.33}px ${HEAD}`;
    ctx.fillText(label, 0, 0);
  }
}

async function readyFonts() {
  try {
    await document.fonts.ready;
  } catch {
    /* 글꼴을 못 받아와도 시스템 글꼴로 그립니다 */
  }
}

async function save(canvas: HTMLCanvasElement, filename: string) {
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("카드를 만들지 못했어요.");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadStampCard(opts: {
  villageName: string;
  exhibitionName: string;
  /** 마을의 모든 곳. 들른 곳은 stamped: true. */
  places: { name: string; stamped: boolean }[];
  /** 비우면 이름 줄을 아예 그리지 않습니다. */
  name?: string;
  withDate?: boolean;
}) {
  await readyFonts();

  const W = 1080;
  const n = Math.max(1, opts.places.length);
  const done = opts.places.filter((p) => p.stamped).length;
  const all = done === n;

  // 도장이 열두 개까지 늘 수 있어 한 줄로는 못 담습니다. 격자로 폅니다.
  const cols = n <= 3 ? n : n <= 8 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const cellW = (W - 120) / cols;
  const r = Math.min(cellW * 0.38, 92);
  const cellH = r * 2.5;

  const gridTop = 320;
  const gridH = rows * cellH;

  const groundH = 150;
  let below = gridTop + gridH + 96;
  if (opts.name) below += 100;
  if (opts.withDate) below += 56;
  const H = Math.round(below + 110 + groundH);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#e3d7c6";
  ctx.lineWidth = 3;
  roundRect(ctx, 40, 40, W - 80, H - 80, 28);
  ctx.stroke();
  ctx.strokeStyle = "#efe6d8";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 56, 56, W - 112, H - 112, 20);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = SOFT;
  ctx.font = `26px ${BODY}`;
  ctx.fillText(opts.exhibitionName, W / 2, 108);

  ctx.fillStyle = INK;
  ctx.font = `68px ${HEAD}`;
  ctx.fillText("마을 도장판", W / 2, 162);

  ctx.fillStyle = SOFT;
  ctx.font = `28px ${BODY}`;
  ctx.fillText(`${opts.villageName} · ${done} / ${n}`, W / 2, 252);

  // 도장 격자
  const tilts = [-0.13, 0.08, -0.06, 0.11, -0.09, 0.05, -0.11, 0.09, -0.04, 0.12, -0.08, 0.06];
  opts.places.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    // 마지막 줄이 덜 찼으면 가운데로 모읍니다.
    const rowW = inRow * cellW;
    const x = (W - rowW) / 2 + cellW * (col + 0.5);
    const y = gridTop + cellH * (row + 0.5);
    drawStamp(ctx, x, y, r, p.name, tilts[i % tilts.length], p.stamped);
  });

  ctx.fillStyle = INK;
  ctx.font = `42px ${HAND}`;
  ctx.fillText(
    all ? "이 마을을 끝까지 걸었습니다" : "이만큼 걸었습니다",
    W / 2,
    gridTop + gridH + 30
  );

  let ly = gridTop + gridH + 96;
  if (opts.name) {
    ctx.strokeStyle = "#ddd0bb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 210, ly + 62);
    ctx.lineTo(W / 2 + 210, ly + 62);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = `52px ${HEAD}`;
    ctx.fillText(opts.name, W / 2, ly);
    ly += 100;
  }
  if (opts.withDate) {
    ctx.fillStyle = SOFT;
    ctx.font = `28px ${BODY}`;
    ctx.fillText(today(), W / 2, ly);
    ly += 56;
  }

  const groundY = H - groundH;
  ctx.fillStyle = "#cfe0b0";
  ctx.fillRect(56, groundY, W - 112, H - 56 - groundY);
  ctx.fillStyle = "#b4c893";
  ctx.fillRect(56, groundY, W - 112, 5);

  const kinds = ["daisy", "cosmos", "tulip", "sunflower", "forget", "rose", "baby"];
  for (let i = 0; i < 7; i++) {
    const x = 130 + ((W - 260) / 6) * i;
    drawFlower(ctx, flowerOf(kinds[i % kinds.length]), x, groundY + 6, 21, 56);
  }

  ctx.fillStyle = WOOD;
  ctx.font = `24px ${BODY}`;
  ctx.fillText(opts.villageName, W / 2, H - 108);

  const stem = opts.name ? `${opts.name}_마을도장판` : "마을도장판";
  await save(canvas, `${stem}.png`);
}
