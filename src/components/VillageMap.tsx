"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAP,
  SEASONS,
  SEASON_ICON,
  currentSeason,
  mapHeight,
  placeX,
  roadPath,
  scatter,
  statusOf,
  stopY,
  village,
  type Place,
  type PlaceKind,
  type Season,
} from "@/lib/village";

const PLACES = village.places;
const H = mapHeight(PLACES.length);
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/* ── 건물 그림 ─────────────────────────────────
   viewBox는 모두 0 0 100 100 입니다. 새 건물을 그릴 때도 이 상자를 지키면
   지도 위 크기가 저절로 맞습니다. */

function BuildingArt({ kind }: { kind: PlaceKind }) {
  const wood = "var(--cv-wood)";
  const woodDark = "var(--cv-wood-dark)";

  if (kind === "gate") {
    return (
      <>
        <rect x="16" y="34" width="9" height="52" rx="3" fill={wood} />
        <rect x="75" y="34" width="9" height="52" rx="3" fill={wood} />
        <path d="M10 36 Q50 18 90 36 L90 44 Q50 27 10 44 Z" fill={woodDark} />
        <rect x="27" y="44" width="46" height="19" rx="5" fill="#f6e2c2" stroke={woodDark} strokeWidth="2.5" />
        <circle cx="50" cy="53.5" r="4" fill="var(--cv-accent)" />
        <ellipse cx="50" cy="88" rx="42" ry="5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "bookhouse") {
    return (
      <>
        <rect x="20" y="46" width="60" height="40" rx="4" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <path d="M12 48 L50 20 L88 48 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <rect x="44" y="34" width="12" height="9" rx="2" fill="#fdf4e4" stroke={woodDark} strokeWidth="1.6" />
        <rect x="29" y="56" width="17" height="15" rx="2.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.8" />
        <path d="M37.5 56 V71 M29 63.5 H46" stroke={woodDark} strokeWidth="1.4" />
        <rect x="56" y="58" width="16" height="28" rx="2.5" fill={wood} stroke={woodDark} strokeWidth="1.8" />
        <circle cx="60" cy="72" r="1.7" fill={woodDark} />
        {/* 창가에 쌓아 둔 책 */}
        <rect x="26" y="76" width="16" height="3.4" rx="1.2" fill="var(--cv-accent)" />
        <rect x="27.5" y="80" width="13" height="3.4" rx="1.2" fill="#8fb4dd" />
        <ellipse cx="50" cy="88" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "greenhouse") {
    return (
      <>
        <path d="M18 86 V50 Q50 22 82 50 V86 Z" fill="#dff0ea" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" opacity="0.96" />
        <path d="M50 26 V86 M18 58 H82 M18 72 H82" stroke={woodDark} strokeWidth="1.5" opacity="0.75" />
        <path d="M34 30 Q42 40 34 52" stroke="#fff" strokeWidth="3" fill="none" opacity="0.65" strokeLinecap="round" />
        {/* 안에서 자라는 꽃 */}
        <path d="M38 86 V72" stroke="var(--cv-grass-deep)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="38" cy="69" r="5" fill="var(--cv-accent)" />
        <path d="M60 86 V76" stroke="var(--cv-grass-deep)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="73" r="4" fill="var(--cv-accent)" opacity="0.8" />
        <rect x="14" y="84" width="72" height="5" rx="2.4" fill={woodDark} />
        <ellipse cx="50" cy="90.5" rx="40" ry="4" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "postoffice") {
    return (
      <>
        <rect x="22" y="48" width="56" height="38" rx="4" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <path d="M14 50 L50 24 L86 50 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        {/* 편지 봉투 간판 */}
        <rect x="38" y="33" width="24" height="16" rx="2" fill="#fdf4e4" stroke={woodDark} strokeWidth="1.8" />
        <path d="M38 34.5 L50 43 L62 34.5" stroke={woodDark} strokeWidth="1.6" fill="none" />
        <rect x="30" y="58" width="18" height="16" rx="2.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.8" />
        <rect x="56" y="60" width="15" height="26" rx="2.5" fill={wood} stroke={woodDark} strokeWidth="1.8" />
        {/* 문 앞 화분 */}
        <path d="M26 86 V79" stroke="var(--cv-grass-deep)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="26" cy="76" r="4.5" fill="var(--cv-accent)" />
        <path d="M79 86 V80" stroke="var(--cv-grass-deep)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="79" cy="77" r="4" fill="var(--cv-accent)" opacity="0.85" />
        <ellipse cx="50" cy="88.5" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  /* 아직 문을 열지 않은 자리 */
  return (
    <>
      <rect x="20" y="62" width="60" height="4" rx="2" fill={wood} opacity="0.85" />
      <rect x="24" y="58" width="4.5" height="28" rx="2" fill={wood} opacity="0.85" />
      <rect x="71.5" y="58" width="4.5" height="28" rx="2" fill={wood} opacity="0.85" />
      <rect x="47.5" y="58" width="4.5" height="28" rx="2" fill={wood} opacity="0.85" />
      <circle cx="36" cy="80" r="3.5" fill="var(--cv-accent)" opacity="0.55" />
      <circle cx="63" cy="82" r="3" fill="var(--cv-accent)" opacity="0.45" />
      <ellipse cx="50" cy="88" rx="36" ry="4" fill="var(--cv-grass-deep)" opacity="0.28" />
    </>
  );
}

/* ── 지도 배경 ─────────────────────────────── */

function MapBackdrop() {
  const trees = scatter(16, 20260827);
  const road = roadPath(PLACES.length);

  return (
    <svg
      className="cv-mapSvg"
      viewBox={`0 0 ${MAP.width} ${H}`}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cv-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--cv-hill)" />
          <stop offset="0.18" stopColor="var(--cv-grass)" />
          <stop offset="1" stopColor="var(--cv-grass)" />
        </linearGradient>
      </defs>

      {/* 땅 */}
      <path
        d={`M0 54 Q90 14 180 40 Q270 66 360 26 L360 ${H} L0 ${H} Z`}
        fill="url(#cv-ground)"
      />
      {/* 뒤쪽 언덕 */}
      <ellipse cx="66" cy="62" rx="86" ry="34" fill="var(--cv-hill)" opacity="0.75" />
      <ellipse cx="292" cy="52" rx="78" ry="30" fill="var(--cv-hill)" opacity="0.6" />

      {/* 길 — 흙바닥, 그 위에 밝은 길, 가운데 징검돌 */}
      <path d={road} stroke="var(--cv-road-edge)" strokeWidth="36" fill="none" strokeLinecap="round" />
      <path d={road} stroke="var(--cv-road)" strokeWidth="29" fill="none" strokeLinecap="round" />
      <path
        d={road}
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="0.5 17"
        opacity="0.5"
      />

      {/* 나무 — 길을 피해 바깥쪽에만 심습니다 */}
      {trees.map((t, i) => {
        const left = i % 2 === 0;
        const x = left ? 10 + t.x * 44 : 306 + t.x * 44;
        const y = 96 + t.y * (H - 190);
        const s = t.s;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x="-2.4" y="-6" width="4.8" height="16" rx="2" fill="var(--cv-wood-dark)" opacity="0.9" />
            <circle cx="0" cy="-14" r="11" fill="var(--cv-grass-deep)" />
            <circle cx="-7" cy="-7" r="8" fill="var(--cv-grass-deep)" opacity="0.92" />
            <circle cx="7" cy="-8" r="7.5" fill="var(--cv-grass-deep)" opacity="0.85" />
            {t.k === 0 && <circle cx="3" cy="-18" r="2.6" fill="var(--cv-accent)" opacity="0.9" />}
            {t.k === 0 && <circle cx="-6" cy="-13" r="2" fill="var(--cv-accent)" opacity="0.75" />}
          </g>
        );
      })}

      {/* 작은 연못 */}
      <ellipse cx="300" cy={H - 128} rx="40" ry="17" fill="#bfe0ea" opacity="0.85" />
      <ellipse cx="300" cy={H - 128} rx="40" ry="17" fill="none" stroke="var(--cv-grass-deep)" strokeWidth="2" opacity="0.5" />
      <path d="M282 -8 q7 -4 13 0" transform={`translate(0 ${H - 122})`} stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  );
}

/* ── 화면 ──────────────────────────────────── */

export default function VillageMap() {
  // 서버가 그린 첫 화면과 어긋나지 않도록 봄으로 시작한 뒤, 뜨자마자 이번 주 계절로 맞춥니다.
  const [season, setSeason] = useState<Season>("봄");
  const [autoSeason, setAutoSeason] = useState<Season>("봄");
  const [openId, setOpenId] = useState<string | null>(null);
  const [touring, setTouring] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const placeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const s = currentSeason();
    setSeason(s);
    setAutoSeason(s);
  }, []);

  const open = PLACES.find((p) => p.id === openId) ?? null;

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setTouring(false);
    lastFocus.current?.focus();
  }, []);

  const openPlace = useCallback((p: Place, viaTour = false) => {
    lastFocus.current = (document.activeElement as HTMLElement) ?? null;
    setOpenId(p.id);
    if (viaTour) setTouring(true);
    placeRefs.current[p.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // 시트가 열려 있는 동안은 뒤쪽이 스크롤되지 않게 잠급니다.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeSheet]);

  const tourable = PLACES.filter((p) => statusOf(p) !== "landmark");
  const tourIdx = open ? tourable.findIndex((p) => p.id === open.id) : -1;
  const next = touring && tourIdx >= 0 ? tourable[tourIdx + 1] : undefined;

  const startTour = () => {
    if (tourable.length) openPlace(tourable[0], true);
  };

  const isExternal = (href: string) => /^https?:\/\//.test(href);

  return (
    <div className="cv-root" data-season={season}>
      <header className="cv-hero cv-wrap">
        <span className="cv-eyebrow">{village.hero.eyebrow}</span>
        <h1 className="cv-title">{village.hero.title}</h1>
        <div className="cv-lines">
          {village.hero.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>

        <div className="cv-heroActions">
          <button className="cv-btn cv-btn--go" onClick={startTour}>
            {village.hero.tourCta}
          </button>
        </div>

        <div className="cv-seasons" role="group" aria-label="마을 계절 고르기">
          {SEASONS.map((s) => (
            <button
              key={s}
              className="cv-seasonBtn"
              aria-pressed={season === s}
              onClick={() => setSeason(s)}
            >
              {SEASON_ICON[s]} {s}
            </button>
          ))}
        </div>
        <p className="cv-seasonNote">
          {season === autoSeason
            ? `이번 주 마을은 ${autoSeason}이에요`
            : `이번 주 마을은 원래 ${autoSeason}이에요`}
        </p>
      </header>

      <div className="cv-map">
        <MapBackdrop />

        <div className="cv-layer">
          {PLACES.map((p, i) => {
            const st = statusOf(p);
            const landmark = st === "landmark";
            return (
              <button
                key={p.id}
                ref={(el) => {
                  placeRefs.current[p.id] = el;
                }}
                className="cv-place"
                data-here={touring && open?.id === p.id ? "true" : undefined}
                style={{ left: pct(placeX(i), MAP.width), top: pct(stopY(i), H) }}
                onClick={() => !landmark && openPlace(p)}
                disabled={landmark}
                aria-label={
                  landmark
                    ? `${p.name} — ${p.blurb}`
                    : `${p.name} — ${p.theme}. ${st === "soon" ? "준비 중" : "눌러서 자세히 보기"}`
                }
              >
                {touring && open?.id === p.id && (
                  <span className="cv-here" aria-hidden="true">
                    📍
                  </span>
                )}
                <svg className="cv-placeArt" viewBox="0 0 100 100" aria-hidden="true">
                  <BuildingArt kind={p.kind} />
                </svg>
                <span className={`cv-sign${st === "soon" ? " cv-signSoon" : ""}`}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cv-wrap">
        <section className="cv-guide">
          <h2 className="cv-guideTitle">{village.guide.title}</h2>
          <ul className="cv-guideList">
            {village.guide.steps.map((s, i) => (
              <li key={i}>
                <span className="cv-guideIcon" aria-hidden="true">
                  {s.icon === "tap" ? "👆" : s.icon === "walk" ? "🚪" : "🌸"}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="cv-footer">
        <p className="cv-footerNote">{village.footer.note}</p>
        <p className="cv-footerCredit">{village.footer.credit}</p>
      </footer>

      {open && (
        <>
          <button className="cv-scrim" onClick={closeSheet} aria-label="닫기" />
          <div
            className="cv-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-sheetName"
            tabIndex={-1}
            ref={sheetRef}
          >
            <div className="cv-grip" />
            <div className="cv-sheetHead">
              <svg className="cv-sheetArt" viewBox="0 0 100 100" aria-hidden="true">
                <BuildingArt kind={open.kind} />
              </svg>
              <div>
                <h2 className="cv-sheetName" id="cv-sheetName">
                  {open.name}
                </h2>
                <span className="cv-chip">{open.theme}</span>
              </div>
            </div>

            <p className="cv-sheetBlurb">{open.blurb}</p>
            <p className="cv-sheetHowto">{open.howto}</p>

            {statusOf(open) === "soon" && (
              <p className="cv-soonNote">아직 문을 열지 않았어요. 곧 만나요 🌱</p>
            )}

            {/* 준비 중인 곳에서도 투어가 멈추지 않도록, 「다음」은 항상 함께 둡니다. */}
            <div className="cv-sheetActions">
              {statusOf(open) === "open" && (
                <a
                  className="cv-btn cv-btn--go"
                  href={open.href}
                  target={isExternal(open.href) ? "_blank" : undefined}
                  rel={isExternal(open.href) ? "noopener noreferrer" : undefined}
                >
                  들어가기
                </a>
              )}
              {next ? (
                <button
                  className={`cv-btn${statusOf(open) === "open" ? " cv-btn--ghost" : ""}`}
                  onClick={() => openPlace(next, true)}
                >
                  다음 →
                </button>
              ) : (
                <button
                  className={`cv-btn${statusOf(open) === "open" ? " cv-btn--ghost" : ""}`}
                  onClick={closeSheet}
                >
                  {touring ? "마을 투어 끝!" : "지도로 돌아가기"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
