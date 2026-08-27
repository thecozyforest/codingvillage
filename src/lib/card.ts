import { drawFlower, drawFlowerHead, flowerOf } from "./flowers";
import type { Entry } from "./gardenTypes";

/* ==========================================================
   카드 내려받기

   「10점짜리 행복 정원」의 포토카드는 꽃만 그리고 글을 그리지 않습니다.
   받은 사람 입장에서 정작 남는 건 글인데 말이죠.
   그래서 이 카드는 글을 먼저 세우고 꽃을 곁들입니다.
   ========================================================== */

const INK = "#43352c";
const SOFT = "#8b7a6c";
const PAPER = "#fbf7f2";
const LINE = "#e6dbcd";

const HEAD_FONT = `"Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
const HAND_FONT = `"Gaegu", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
const BODY_FONT = `"Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`;

/** 한글은 글자 단위로 넘어가도 자연스럽습니다. 띄어쓰기가 있으면 거기서 먼저 끊습니다. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) {
      out.push("");
      continue;
    }
    let line = "";
    let lastSpace = -1;
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        if (ch !== " " && lastSpace > 0 && line.length - lastSpace < 12) {
          out.push(line.slice(0, lastSpace));
          line = line.slice(lastSpace + 1) + ch;
        } else {
          out.push(line);
          line = ch === " " ? "" : ch;
        }
        lastSpace = -1;
      } else {
        line = test;
        if (ch === " ") lastSpace = line.length - 1;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

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

/** 글 한 덩어리가 차지할 높이를 미리 재 둡니다(카드 전체 높이를 정하려면 필요). */
function measureNotes(
  ctx: CanvasRenderingContext2D,
  entries: Entry[],
  colW: number,
  msgSize: number
) {
  const pad = 28;
  const textW = colW - pad * 2 - 74;
  ctx.font = `${msgSize}px ${HAND_FONT}`;
  return entries.map((e) => {
    const lines = wrap(ctx, e.message, textW);
    const h = Math.max(96, pad * 2 + lines.length * (msgSize * 1.42) + 30);
    return { entry: e, lines, h };
  });
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  note: { entry: Entry; lines: string[]; h: number },
  x: number,
  y: number,
  w: number,
  msgSize: number
) {
  const pad = 28;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, w, note.h, 20);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawFlowerHead(ctx, flowerOf(note.entry.flower), x + pad + 24, y + pad + 24, 24);

  ctx.fillStyle = INK;
  ctx.font = `${msgSize}px ${HAND_FONT}`;
  ctx.textBaseline = "top";
  let ty = y + pad;
  for (const line of note.lines) {
    ctx.fillText(line, x + pad + 62, ty);
    ty += msgSize * 1.42;
  }

  ctx.fillStyle = SOFT;
  ctx.font = `20px ${BODY_FONT}`;
  const who = note.entry.fromName ? `— ${note.entry.fromName}` : "— 이름을 남기지 않은 손님";
  ctx.fillText(`${who} · ${note.entry.dateKey}`, x + pad + 62, y + note.h - pad - 20);
}

/** 카드 위쪽의 정원 그림 */
function drawGardenBand(
  ctx: CanvasRenderingContext2D,
  entries: Entry[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "#d6ebf7");
  grad.addColorStop(1, "#eaf3e6");
  ctx.save();
  roundRect(ctx, x, y, w, h, 22);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#cfe3c0";
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.24, y + h * 0.52, w * 0.34, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.8, y + h * 0.46, w * 0.3, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const perRow = Math.max(6, Math.min(16, Math.round(w / 74)));
  const shown = entries.slice(0, perRow * 2);
  const rows = Math.max(1, Math.ceil(shown.length / perRow));
  const rowH = (h - 40) / rows;

  for (let r = 0; r < rows; r++) {
    const groundY = y + 40 + (r + 1) * rowH;
    ctx.fillStyle = r % 2 === 0 ? "#cfe0b0" : "#c6d9a6";
    ctx.fillRect(x, groundY, w, rowH + 10);
    const slice = shown.slice(r * perRow, (r + 1) * perRow);
    const slot = w / (slice.length + 1);
    slice.forEach((e, i) => {
      const jitter = (e.x - 0.5) * slot * 0.4;
      drawFlower(ctx, flowerOf(e.flower), x + slot * (i + 1) + jitter, groundY + 4, 19 * (e.scale || 1), 52);
    });
  }

  if (entries.length > shown.length) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    roundRect(ctx, x + w - 178, y + 18, 160, 40, 20);
    ctx.fill();
    ctx.fillStyle = SOFT;
    ctx.font = `22px ${BODY_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`외 ${entries.length - shown.length}송이 더`, x + w - 98, y + 38);
    ctx.textAlign = "left";
  }
  ctx.restore();
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

/** 글꼴이 다 실리기 전에 그리면 글자가 기본 글꼴로 박힙니다. */
async function readyFonts() {
  try {
    await document.fonts.ready;
  } catch {
    /* 글꼴을 못 받아와도 시스템 글꼴로 그립니다 */
  }
}

/* ── ① 학생 한 명의 꽃다발 ────────────────── */

export async function downloadBouquetCard(opts: {
  studentName: string;
  entries: Entry[];
  exhibitionName: string;
}) {
  await readyFonts();
  const W = 1080;
  const M = 56;
  const colW = W - M * 2;
  const msgSize = 34;

  const probe = document.createElement("canvas").getContext("2d")!;
  const notes = measureNotes(probe, opts.entries, colW, msgSize);

  const headH = 250;
  const bandH = opts.entries.length ? 300 : 0;
  const notesH = notes.reduce((a, n) => a + n.h + 16, 0);
  const H = Math.min(30000, headH + bandH + 30 + notesH + 130);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "top";
  ctx.fillStyle = SOFT;
  ctx.font = `24px ${BODY_FONT}`;
  ctx.fillText(`${opts.exhibitionName} · ${today()}`, M, 56);

  ctx.fillStyle = INK;
  ctx.font = `64px ${HEAD_FONT}`;
  ctx.fillText(`${opts.studentName}님에게 온 꽃다발`, M, 100);

  ctx.fillStyle = SOFT;
  ctx.font = `28px ${BODY_FONT}`;
  ctx.fillText(`꽃 ${opts.entries.length}송이와 그 안에 담긴 말`, M, 184);

  let y = headH;
  if (bandH) {
    drawGardenBand(ctx, opts.entries, M, y, colW, bandH - 20);
    y += bandH + 10;
  }

  for (const n of notes) {
    if (y + n.h > H - 110) break;
    drawNote(ctx, n, M, y, colW, msgSize);
    y += n.h + 16;
  }

  ctx.fillStyle = SOFT;
  ctx.font = `24px ${BODY_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("코딩빌리지 · 꽃 우체국", W / 2, H - 72);
  ctx.textAlign = "left";

  await save(canvas, `${opts.studentName}_꽃다발.png`);
}

/* ── ② 모두의 정원 한 장 ──────────────────── */

export async function downloadGardenCard(opts: {
  entries: Entry[];
  exhibitionName: string;
  studentCount: number;
}) {
  await readyFonts();
  const W = 1600;
  const M = 60;
  const gap = 28;
  const colW = (W - M * 2 - gap) / 2;
  const msgSize = 30;

  const probe = document.createElement("canvas").getContext("2d")!;
  const notes = measureNotes(probe, opts.entries, colW, msgSize);

  // 두 칸에 번갈아 채우지 않고, 짧은 쪽에 넣어 높이를 맞춥니다.
  const colH = [0, 0];
  const placed: { n: (typeof notes)[number]; col: number; y: number }[] = [];
  for (const n of notes) {
    const col = colH[0] <= colH[1] ? 0 : 1;
    placed.push({ n, col, y: colH[col] });
    colH[col] += n.h + 16;
  }

  const headH = 240;
  const bandH = opts.entries.length ? 340 : 0;
  const H = Math.min(30000, headH + bandH + 30 + Math.max(colH[0], colH[1]) + 130);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "top";
  ctx.fillStyle = SOFT;
  ctx.font = `26px ${BODY_FONT}`;
  ctx.fillText(`${opts.exhibitionName} · ${today()}`, M, 54);

  ctx.fillStyle = INK;
  ctx.font = `70px ${HEAD_FONT}`;
  ctx.fillText("모두의 정원", M, 98);

  ctx.fillStyle = SOFT;
  ctx.font = `30px ${BODY_FONT}`;
  ctx.fillText(
    `${opts.studentCount}명의 정원에 꽃 ${opts.entries.length}송이가 피었습니다`,
    M,
    186
  );

  let top = headH;
  if (bandH) {
    drawGardenBand(ctx, opts.entries, M, top, W - M * 2, bandH - 20);
    top += bandH + 10;
  }

  for (const p of placed) {
    const x = M + p.col * (colW + gap);
    const y = top + p.y;
    if (y + p.n.h > H - 110) continue;
    drawNote(ctx, p.n, x, y, colW, msgSize);
  }

  ctx.fillStyle = SOFT;
  ctx.font = `26px ${BODY_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("코딩빌리지 · 꽃 우체국", W / 2, H - 74);
  ctx.textAlign = "left";

  await save(canvas, `모두의정원_${new Date().toISOString().slice(0, 10)}.png`);
}
