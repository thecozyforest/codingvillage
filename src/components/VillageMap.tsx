"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAP,
  SEASONS,
  SEASON_ICON,
  currentSeason,
  drivewayPath,
  mapHeight,
  placePoint,
  roadPath,
  scatter,
  statusOf,
  village,
  type Place,
  type PlaceKind,
  type Season,
} from "@/lib/village";
import { SeasonAir } from "./SeasonAir";
import { downloadStampCard } from "@/lib/stampCard";

const PLACES = village.places;
const H = mapHeight(PLACES.length);
const pct = (v: number, total: number) => `${(v / total) * 100}%`;
const STAMP_KEY = "codingvillage-stamps";

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

  if (kind === "gym") {
    // 습관 훈련소 — 매일 드나드는 곳이라 문을 넓게, 지붕은 낮게.
    return (
      <>
        <path d="M14 50 Q50 30 86 50 L86 56 Q50 36 14 56 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <rect x="18" y="54" width="64" height="32" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <rect x="38" y="62" width="24" height="24" rx="2" fill={wood} stroke={woodDark} strokeWidth="1.8" />
        <path d="M50 62 V86" stroke={woodDark} strokeWidth="1.4" />
        {/* 아령 간판 */}
        <rect x="24" y="40" width="52" height="3" rx="1.5" fill={woodDark} />
        <rect x="20" y="34" width="7" height="15" rx="2.5" fill={woodDark} />
        <rect x="73" y="34" width="7" height="15" rx="2.5" fill={woodDark} />
        <rect x="24" y="64" width="10" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.5" />
        <rect x="66" y="64" width="10" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.5" />
        <ellipse cx="50" cy="88" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "drawer") {
    // 밑줄 서랍 — 건물이 통째로 서랍장입니다.
    return (
      <>
        <path d="M16 40 L50 26 L84 40 L84 46 L16 46 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <rect x="20" y="46" width="60" height="40" rx="3" fill="#f3e3c8" stroke={woodDark} strokeWidth="2" />
        {[50, 60, 70].map((y) => (
          <g key={y}>
            <rect x="25" y={y} width="50" height="9" rx="2" fill="#fdf4e4" stroke={woodDark} strokeWidth="1.4" />
            <rect x="45" y={y + 3.4} width="10" height="2.4" rx="1.2" fill={woodDark} />
          </g>
        ))}
        {/* 서랍에서 삐져나온 종이 한 장 */}
        <rect x="30" y="57.5" width="16" height="4" rx="1" fill="#fff" stroke={woodDark} strokeWidth="0.9" />
        <path d="M32 60 H43" stroke="var(--cv-accent)" strokeWidth="1.2" />
        <ellipse cx="50" cy="88" rx="38" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "lab") {
    // 말랑문법연구소 — 삼각 플라스크 간판.
    return (
      <>
        <rect x="22" y="44" width="56" height="42" rx="3" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <rect x="18" y="38" width="64" height="8" rx="3" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" />
        <path d="M46 20 H54 V30 L62 44 H38 L46 30 Z" fill="#dff0ea" stroke={woodDark} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M41 38 H59 L62 44 H38 Z" fill="var(--cv-accent)" opacity="0.85" />
        <circle cx="47" cy="34" r="1.8" fill={woodDark} opacity="0.5" />
        <circle cx="54" cy="30" r="1.3" fill={woodDark} opacity="0.4" />
        <rect x="28" y="52" width="16" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.6" />
        <rect x="56" y="52" width="16" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.6" />
        <rect x="42" y="70" width="16" height="16" rx="2" fill={wood} stroke={woodDark} strokeWidth="1.6" />
        <ellipse cx="50" cy="88" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "hanok") {
    // 고전 이야기극장 — 처마가 살짝 들린 기와지붕.
    return (
      <>
        <path
          d="M8 44 Q18 34 30 30 Q50 24 70 30 Q82 34 92 44 Q80 41 70 40 L30 40 Q20 41 8 44 Z"
          fill="#6b7f8c"
          stroke={woodDark}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 44 Q50 38 86 44 L86 50 Q50 44 14 50 Z" fill="#8496a2" stroke={woodDark} strokeWidth="1.5" />
        <rect x="22" y="50" width="56" height="34" fill="#f6ead3" stroke={woodDark} strokeWidth="1.8" />
        {/* 창살 */}
        <rect x="27" y="55" width="20" height="18" fill="#fdf7ea" stroke={woodDark} strokeWidth="1.4" />
        <path d="M37 55 V73 M27 64 H47" stroke={woodDark} strokeWidth="1" />
        <rect x="53" y="55" width="20" height="18" fill="#fdf7ea" stroke={woodDark} strokeWidth="1.4" />
        <path d="M63 55 V73 M53 64 H73" stroke={woodDark} strokeWidth="1" />
        <rect x="20" y="84" width="60" height="4" rx="1.5" fill={woodDark} />
        <ellipse cx="50" cy="90" rx="40" ry="4" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "clinic") {
    // 오답 진료소 — 십자 간판.
    return (
      <>
        <rect x="20" y="44" width="60" height="42" rx="4" fill="#fdf9f2" stroke={woodDark} strokeWidth="2" />
        <path d="M14 46 L50 24 L86 46 Z" fill="#dfe9ef" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <rect x="45" y="30" width="10" height="14" rx="1.5" fill="var(--cv-accent)" />
        <rect x="43" y="34" width="14" height="6" rx="1.5" fill="var(--cv-accent)" />
        <rect x="27" y="52" width="18" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.6" />
        <rect x="55" y="52" width="18" height="14" rx="2" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.6" />
        <rect x="41" y="70" width="18" height="16" rx="2" fill={wood} stroke={woodDark} strokeWidth="1.6" />
        <ellipse cx="50" cy="88" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "tower") {
    // 진로 관제탑 — 높이 올라가 멀리 봅니다.
    return (
      <>
        <path d="M40 86 L43 40 H57 L60 86 Z" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <path d="M33 40 H67 L62 26 H38 Z" fill="#cfe6f2" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <path d="M38 33 H62" stroke={woodDark} strokeWidth="1.2" opacity="0.7" />
        <path d="M50 26 V16" stroke={woodDark} strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="14" r="3.4" fill="var(--cv-accent)" />
        <rect x="44" y="56" width="12" height="10" rx="1.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.3" />
        <rect x="43" y="74" width="14" height="12" rx="1.5" fill={wood} stroke={woodDark} strokeWidth="1.5" />
        <rect x="28" y="82" width="44" height="5" rx="2" fill={woodDark} opacity="0.9" />
        <ellipse cx="50" cy="89" rx="34" ry="4" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "signpost") {
    // 진로 나침반 — 갈림길에 선 이정표.
    return (
      <>
        <rect x="46" y="30" width="8" height="56" rx="3" fill={wood} stroke={woodDark} strokeWidth="1.6" />
        <path d="M46 38 H26 L18 44 L26 50 H46 Z" fill="#f6e2c2" stroke={woodDark} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M54 54 H74 L82 60 L74 66 H54 Z" fill="#f6e2c2" stroke={woodDark} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M28 44 H40 M62 60 H74" stroke={woodDark} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        <circle cx="50" cy="24" r="9" fill="#dff0ea" stroke={woodDark} strokeWidth="1.8" />
        <path d="M50 18 L53 24 L50 30 L47 24 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="0.8" />
        <ellipse cx="50" cy="88" rx="26" ry="4" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "workshop") {
    // 기록 공방 — 톱니 지붕(공장·작업장)과 연장 걸이.
    return (
      <>
        <path
          d="M16 52 L28 40 L28 52 L40 40 L40 52 L52 40 L52 52 L64 40 L64 52 L76 40 L76 52 L84 52 L84 58 L16 58 Z"
          fill="var(--cv-accent)"
          stroke={woodDark}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <rect x="20" y="58" width="60" height="28" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <rect x="26" y="64" width="14" height="12" rx="1.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.4" />
        <rect x="44" y="68" width="30" height="18" rx="2" fill={wood} stroke={woodDark} strokeWidth="1.6" />
        {/* 작업대 위 연필 */}
        <path d="M27 82 L38 82" stroke={woodDark} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M38 82 L41 82" stroke="var(--cv-accent)" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="50" cy="88" rx="40" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "observatory") {
    // 인구 전망대 — 둥근 돔.
    return (
      <>
        <path d="M24 52 A26 26 0 0 1 76 52 Z" fill="#cfe6f2" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 26 V52" stroke={woodDark} strokeWidth="1.3" opacity="0.6" />
        <path d="M34 34 Q50 40 66 34" stroke={woodDark} strokeWidth="1.1" fill="none" opacity="0.5" />
        {/* 관측 창 */}
        <path d="M44 28 L56 28 L54 44 L46 44 Z" fill="#fdf4e4" stroke={woodDark} strokeWidth="1.4" />
        <rect x="20" y="52" width="60" height="6" rx="2" fill={woodDark} />
        <rect x="24" y="58" width="52" height="28" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        <rect x="31" y="64" width="12" height="12" rx="1.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.4" />
        <rect x="57" y="64" width="12" height="12" rx="1.5" fill="#cfe6f2" stroke={woodDark} strokeWidth="1.4" />
        <rect x="44" y="72" width="12" height="14" rx="1.5" fill={wood} stroke={woodDark} strokeWidth="1.5" />
        <ellipse cx="50" cy="88" rx="38" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
      </>
    );
  }

  if (kind === "library") {
    return (
      <>
        {/* 계단 */}
        <rect x="18" y="82" width="64" height="4" rx="1.5" fill="#e6dcc8" stroke={woodDark} strokeWidth="1.2" />
        <rect x="22" y="78" width="56" height="4" rx="1.5" fill="#efe6d4" stroke={woodDark} strokeWidth="1.2" />
        {/* 본체 */}
        <rect x="22" y="44" width="56" height="34" fill="#fdf4e4" stroke={woodDark} strokeWidth="2" />
        {/* 기둥 넷 */}
        <rect x="27" y="46" width="6" height="32" rx="2" fill="#f3e8d4" stroke={woodDark} strokeWidth="1.3" />
        <rect x="39" y="46" width="6" height="32" rx="2" fill="#f3e8d4" stroke={woodDark} strokeWidth="1.3" />
        <rect x="55" y="46" width="6" height="32" rx="2" fill="#f3e8d4" stroke={woodDark} strokeWidth="1.3" />
        <rect x="67" y="46" width="6" height="32" rx="2" fill="#f3e8d4" stroke={woodDark} strokeWidth="1.3" />
        {/* 문 */}
        <path d="M45 78 V58 a5 5 0 0 1 10 0 V78 Z" fill={wood} stroke={woodDark} strokeWidth="1.6" />
        {/* 지붕(박공) */}
        <path d="M14 45 L50 22 L86 45 Z" fill="var(--cv-accent)" stroke={woodDark} strokeWidth="2" strokeLinejoin="round" />
        {/* 박공 안 펼친 책 */}
        <path d="M42 36 q8 -3 8 0 q0 -3 8 0 v5 q-8 -3 -8 0 q0 -3 -8 0 Z" fill="#fdf4e4" stroke={woodDark} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M50 36 V41" stroke={woodDark} strokeWidth="1" />
        <ellipse cx="50" cy="88" rx="42" ry="4.5" fill="var(--cv-grass-deep)" opacity="0.35" />
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
  const trees = scatter(22, 20260828);
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
          <stop offset="0.14" stopColor="var(--cv-grass)" />
          <stop offset="1" stopColor="var(--cv-grass)" />
        </linearGradient>
      </defs>

      {/* 땅 */}
      <path
        d={`M0 46 Q90 10 180 34 Q270 58 360 20 L360 ${H} L0 ${H} Z`}
        fill="url(#cv-ground)"
      />
      <ellipse cx="62" cy="54" rx="84" ry="30" fill="var(--cv-hill)" opacity="0.7" />
      <ellipse cx="296" cy="46" rx="76" ry="27" fill="var(--cv-hill)" opacity="0.55" />

      {/* 나무 — 고리 바깥 여백에만 심습니다 */}
      {trees.map((t, i) => {
        const left = i % 2 === 0;
        const x = left ? 8 + t.x * 26 : 326 + t.x * 26;
        const y = 110 + t.y * (H - 210);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${t.s * 0.9})`}>
            <rect x="-2.2" y="-5" width="4.4" height="14" rx="2" fill="var(--cv-wood-dark)" opacity="0.9" />
            <circle cx="0" cy="-12" r="10" fill="var(--cv-grass-deep)" />
            <circle cx="-6" cy="-6" r="7" fill="var(--cv-grass-deep)" opacity="0.9" />
            <circle cx="6" cy="-7" r="6.5" fill="var(--cv-grass-deep)" opacity="0.82" />
            {t.k === 0 && <circle cx="3" cy="-16" r="2.4" fill="var(--cv-accent)" opacity="0.9" />}
          </g>
        );
      })}

      {/* 건물에서 큰길로 이어지는 샛길 */}
      {PLACES.map((p, i) => (
        <path
          key={p.id}
          d={drivewayPath(i, PLACES.length)}
          stroke="var(--cv-road-edge)"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {PLACES.map((p, i) => (
        <path
          key={p.id + "-in"}
          d={drivewayPath(i, PLACES.length)}
          stroke="var(--cv-road)"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* 마을 한 바퀴 도는 큰길 */}
      <path d={road} stroke="var(--cv-road-edge)" strokeWidth="36" fill="none" strokeLinejoin="round" />
      <path d={road} stroke="var(--cv-road)" strokeWidth="29" fill="none" strokeLinejoin="round" />
      <path
        d={road}
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="0.5 17"
        opacity="0.45"
      />

      {/* 고리 안쪽 마을 마당 — 연못과 우물 */}
      <ellipse cx={MAP.width / 2} cy={H * 0.34} rx="42" ry="26" fill="#bfe0ea" opacity="0.85" />
      <ellipse cx={MAP.width / 2} cy={H * 0.34} rx="42" ry="26" fill="none" stroke="var(--cv-grass-deep)" strokeWidth="2" opacity="0.5" />
      <g className="cv-ripples">
        <ellipse className="cv-ripple" cx={MAP.width / 2} cy={H * 0.34} rx="11" ry="6" fill="none" stroke="#fff" strokeWidth="1.6" />
        <ellipse className="cv-ripple cv-ripple--b" cx={MAP.width / 2} cy={H * 0.34} rx="11" ry="6" fill="none" stroke="#fff" strokeWidth="1.6" />
      </g>

      {/* 우물 */}
      <g transform={`translate(${MAP.width / 2} ${H * 0.66})`}>
        <ellipse cx="0" cy="14" rx="26" ry="6" fill="var(--cv-grass-deep)" opacity="0.3" />
        <rect x="-16" y="-2" width="32" height="16" rx="3" fill="#cbb59a" stroke="var(--cv-wood-dark)" strokeWidth="1.8" />
        <path d="M-16 2 H16 M-16 8 H16" stroke="var(--cv-wood-dark)" strokeWidth="0.9" opacity="0.5" />
        <path d="M-13 -2 L0 -20 L13 -2" fill="none" stroke="var(--cv-wood-dark)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M-18 -18 H18" stroke="var(--cv-wood-dark)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M0 -18 V-9" stroke="var(--cv-wood-dark)" strokeWidth="1.2" />
        <rect x="-4" y="-9" width="8" height="6" rx="1.5" fill="var(--cv-wood)" stroke="var(--cv-wood-dark)" strokeWidth="1.2" />
      </g>
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
  // 다녀간 곳 도장. 이 브라우저에만 남습니다(서버에 보내지 않습니다).
  const [stamps, setStamps] = useState<Record<string, boolean>>({});
  // 도장은 시트 뒤에서 찍히므로, 시트를 닫는 순간에 「쾅」을 터뜨립니다.
  const [slam, setSlam] = useState<string | null>(null);
  const pendingSlam = useRef<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [withDate, setWithDate] = useState(true);
  const [making, setMaking] = useState(false);
  const [nudgeHidden, setNudgeHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [askReset, setAskReset] = useState(false);

  /**
   * 전시 부스에서 태블릿 하나를 여러 사람이 돌려 쓰면 다음 손님이 앞사람
   * 도장을 보게 됩니다. 그때 비우는 단추입니다.
   * 한 번에 지워지지 않게 물어본 뒤 지웁니다 — 한창 도는 중에 잘못 눌리면
   * 그때까지 걸은 게 사라지니까요.
   */
  const resetStamps = useCallback(() => {
    setStamps({});
    setAskReset(false);
    setNudgeHidden(false);
    setCardName("");
    try {
      localStorage.removeItem(STAMP_KEY);
    } catch {
      /* 저장을 막아 둔 브라우저면 애초에 쌓인 것도 없습니다 */
    }
  }, []);

  const copyCode = useCallback((value: string) => {
    // 복사가 막힌 브라우저에서도 코드는 화면에 그대로 보이니 손으로 옮겨 적으면 됩니다.
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const placeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const s = currentSeason();
    setSeason(s);
    setAutoSeason(s);
    try {
      setStamps(JSON.parse(localStorage.getItem(STAMP_KEY) || "{}"));
    } catch {
      /* 저장을 막아 둔 브라우저면 도장 없이 그냥 씁니다 */
    }
  }, []);

  const stamp = useCallback((id: string) => {
    setStamps((prev) => {
      if (prev[id]) return prev;
      pendingSlam.current = id;
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(STAMP_KEY, JSON.stringify(next));
      } catch {
        /* 저장 못 해도 이번 방문 동안은 찍힌 채로 보입니다 */
      }
      return next;
    });
  }, []);

  const open = PLACES.find((p) => p.id === openId) ?? null;

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setTouring(false);
    lastFocus.current?.focus();
    // 시트에 가려 안 보이던 도장을, 지도가 드러나는 지금 찍습니다.
    if (pendingSlam.current) {
      const id = pendingSlam.current;
      pendingSlam.current = null;
      setSlam(id);
      setTimeout(() => setSlam(null), 900);
    }
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
  // 도장은 **문이 열린 곳만** 셉니다. 「준비 중」인 곳은 들어갈 수가 없어서
  // 분모에 넣으면 아무도 도장판을 채울 수 없습니다.
  const stampable = PLACES.filter((p) => statusOf(p) === 'open');
  // 방명록은 「구경」이 아니라 「하고 가는 것」이라, 다른 곳과 무게를 달리 둡니다.
  const mustDo = PLACES.find((p) => p.final && statusOf(p) === 'open');
  const mustDoLeft = !!mustDo && !stamps[mustDo.id];
  const stampedCount = stampable.filter((p) => stamps[p.id]).length;
  const tourIdx = open ? tourable.findIndex((p) => p.id === open.id) : -1;
  const next = touring && tourIdx >= 0 ? tourable[tourIdx + 1] : undefined;

  const startTour = () => {
    if (tourable.length) openPlace(tourable[0], true);
  };

  const isExternal = (href: string) => /^https?:\/\//.test(href);

  return (
    <div className="cv-root" data-season={season}>
      <SeasonAir season={season} />

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

      <div className="cv-wrap">
        <div className="cv-stampBar">
          <span className="cv-stampBarLabel">마을 도장</span>
          <span className="cv-stampDots">
            {stampable.map((p) => (
              <span
                key={p.id}
                className="cv-stampDot"
                data-on={stamps[p.id] ? "true" : undefined}
                title={p.name}
              />
            ))}
          </span>
          <span className="cv-stampBarCount">
            {stampedCount} / {stampable.length}
          </span>
        </div>
        {/* 도장판은 **언제든** 받을 수 있어야 합니다. 예전에는 12곳을 다 돌아야만
            내려받기 칸이 나타나서, 사실상 아무도 못 받았습니다. */}
        <div className="cv-finish">
          <p className="cv-stampDone">
            {stampedCount === stampable.length
              ? "마을을 다 둘러보셨어요. 고맙습니다 🌸"
              : stampedCount > 0
                ? `지금까지 ${stampedCount}곳을 들렀어요. 도장판은 언제든 받아 갈 수 있어요.`
                : "한 곳이라도 들르면 도장이 찍혀요. 도장판은 지금 받아 가도 괜찮아요."}
          </p>

          <label className="cv-finishField">
            <span>
              이름 <em>(안 적어도 괜찮아요)</em>
            </span>
            <input
              className="cv-finishInput"
              value={cardName}
              maxLength={12}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="비워 두면 이름 없이 나와요"
            />
          </label>

          <label className="cv-finishCheck">
            <input
              type="checkbox"
              checked={withDate}
              onChange={(e) => setWithDate(e.target.checked)}
            />
            오늘 날짜 넣기
          </label>

          <button
            className="cv-btn cv-btn--go"
            disabled={making}
            onClick={async () => {
              setMaking(true);
              try {
                await downloadStampCard({
                  villageName: village.meta.siteName,
                  exhibitionName: village.meta.exhibition,
                  places: stampable.map((p) => ({ name: p.name, stamped: !!stamps[p.id] })),
                  name: cardName.trim() || undefined,
                  withDate,
                });
              } finally {
                setMaking(false);
              }
            }}
          >
            {making ? "만드는 중…" : "도장판 내려받기"}
          </button>

          {stampedCount > 0 &&
            (askReset ? (
              <div className="cv-reset" role="group" aria-label="도장 비우기 확인">
                <span>도장 {stampedCount}개를 모두 지울까요?</span>
                <button className="cv-resetYes" onClick={resetStamps}>
                  지우기
                </button>
                <button className="cv-resetNo" onClick={() => setAskReset(false)}>
                  그만두기
                </button>
              </div>
            ) : (
              <button className="cv-resetOpen" onClick={() => setAskReset(true)}>
                도장판 비우고 처음부터
              </button>
            ))}
        </div>
      </div>

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
                data-slam={slam === p.id ? "true" : undefined}
                data-must={p.final && statusOf(p) === "open" ? "true" : undefined}
                style={{
                  left: pct(placePoint(i, PLACES.length).x, MAP.width),
                  top: pct(placePoint(i, PLACES.length).y, H),
                }}
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
                {stamps[p.id] && (
                  <span className="cv-stamp" aria-hidden="true">
                    다녀감
                  </span>
                )}
                <span className={`cv-sign${st === "soon" ? " cv-signSoon" : ""}`}>{p.name}</span>
                {p.badge && <span className="cv-badge">{p.badge}</span>}
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

      {/* 방명록을 아직 안 쓴 사람에게만 뜨는 띠. 쓰고 나면 사라집니다. */}
      {mustDo && mustDoLeft && !nudgeHidden && !open && (
        <div className="cv-nudge" role="complementary">
          <div className="cv-nudgeText">
            <strong>방명록을 아직 안 쓰셨어요</strong>
            <span>다른 곳은 구경만 해도 괜찮아요</span>
          </div>
          <button
            className="cv-nudgeGo"
            onClick={() => {
              const el = placeRefs.current[mustDo.id];
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              openPlace(mustDo);
            }}
          >
            꽃 놓으러 가기
          </button>
          <button className="cv-nudgeClose" onClick={() => setNudgeHidden(true)} aria-label="이 안내 닫기">
            ✕
          </button>
        </div>
      )}

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
            {/* 투어 중에도 언제든 지도로 빠져나갈 수 있어야 합니다. */}
            <button className="cv-sheetHome" onClick={closeSheet}>
              지도로
            </button>
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

            {/* 코드를 모르면 앱에 들어가도 막히므로 단추보다 먼저 보여 줍니다. */}
            {open.code && statusOf(open) === "open" && (
              <div className="cv-code">
                <span className="cv-codeLabel">{open.code.label}</span>
                <button
                  className="cv-codeValue"
                  onClick={() => copyCode(open.code!.value)}
                  aria-label={`${open.code.label} ${open.code.value} 복사`}
                >
                  {open.code.value}
                  <small>{copied ? "복사했어요" : "눌러서 복사"}</small>
                </button>
                {open.code.hint && <span className="cv-codeHint">{open.code.hint}</span>}
              </div>
            )}

            {statusOf(open) === "soon" && (
              <p className="cv-soonNote">아직 문을 열지 않았어요. 곧 만나요 🌱</p>
            )}

            {/* 문이 둘인 곳 — 행복정원처럼 내 정원과 전체 정원이 갈리는 경우 */}
            {open.extra?.href && (
              <a
                className="cv-btn cv-btn--wide"
                href={open.extra.href}
                target={isExternal(open.extra.href) ? "_blank" : undefined}
                rel={isExternal(open.extra.href) ? "noopener noreferrer" : undefined}
                onClick={() => stamp(open.id)}
              >
                {open.extra.label}
                {open.extra.hint && <small>{open.extra.hint}</small>}
              </a>
            )}

            {/* 준비 중인 곳에서도 투어가 멈추지 않도록, 「다음」은 항상 함께 둡니다. */}
            <div className="cv-sheetActions">
              {statusOf(open) === "open" && (
                <a
                  className="cv-btn cv-btn--go"
                  href={open.href}
                  target={isExternal(open.href) ? "_blank" : undefined}
                  rel={isExternal(open.href) ? "noopener noreferrer" : undefined}
                  onClick={() => stamp(open.id)}
                >
                  {open.enter ?? "들어가기"}
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
