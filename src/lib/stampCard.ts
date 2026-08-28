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

/** 실제로 찍힌 도장 하나. 살짝 기울여 손으로 찍은 느낌을 냅니다. */
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, label: string, tilt: number) {
  ctx.save();
  ctx.translate(cx, cy);
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

  // 이름이 길면 두 줄로 나눕니다(「마을 도서관」처럼 띄어쓰기가 있는 경우).
  const parts = label.split(" ");
  if (parts.length > 1 && label.length > 4) {
    ctx.font = `${r * 0.34}px ${HEAD}`;
    ctx.fillText(parts[0], 0, -r * 0.2);
    ctx.fillText(parts.slice(1).join(" "), 0, r * 0.22);
  } else {
    ctx.font = `${r * 0.38}px ${HEAD}`;
    ctx.fillText(label, 0, 0);
  }

  ctx.restore();
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
  places: string[];
  /** 비우면 이름 줄을 아예 그리지 않습니다. */
  name?: string;
  withDate?: boolean;
}) {
  await readyFonts();

  const W = 1080;
  // 도장 줄 아래 내용이 이름·날짜에 따라 줄었다 늘었다 하므로,
  // 높이를 미리 재서 빈 자리가 남지 않게 합니다.
  const stampY = 470;
  const stampR = opts.places.length <= 3 ? 108 : 88;
  const groundH = 150;
  let below = stampY + stampR + 170;
  if (opts.name) below += 100;
  if (opts.withDate) below += 56;
  const H = Math.round(below + 120 + groundH);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 종이 테두리
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
  ctx.fillText(opts.exhibitionName, W / 2, 112);

  ctx.fillStyle = INK;
  ctx.font = `70px ${HEAD}`;
  ctx.fillText("마을 완주 카드", W / 2, 168);

  ctx.fillStyle = SOFT;
  ctx.font = `30px ${BODY}`;
  ctx.fillText(opts.villageName, W / 2, 262);

  // 도장 줄
  const n = Math.max(1, opts.places.length);
  const r = stampR;
  const gap = (W - 200) / n;
  const y = stampY;
  const tilts = [-0.13, 0.08, -0.06, 0.11, -0.09];
  opts.places.forEach((p, i) => {
    drawStamp(ctx, 100 + gap * (i + 0.5), y, r, p, tilts[i % tilts.length]);
  });

  ctx.fillStyle = INK;
  ctx.font = `44px ${HAND}`;
  ctx.fillText("이 마을을 끝까지 걸었습니다", W / 2, y + r + 70);

  // 이름 · 날짜 — 넣기로 한 것만
  let ly = y + r + 170;
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

  // 바닥 — 풀밭과 꽃 몇 송이
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

  const stem = opts.name ? `${opts.name}_마을완주카드` : "마을완주카드";
  await save(canvas, `${stem}.png`);
}
