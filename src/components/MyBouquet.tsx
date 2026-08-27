"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Garden } from "./Garden";
import { FlowerHead } from "./Flower";
import { downloadBouquetCard } from "@/lib/card";
import type { Entry, Student } from "@/lib/gardenTypes";

/** 전시가 끝난 뒤, 학생이 자기에게 온 꽃다발을 확인하고 내려받는 화면입니다. */
export default function MyBouquet() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [picked, setPicked] = useState<Student | null>(null);
  const [pin, setPin] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/guestbook?action=roster")
      .then((r) => r.json())
      .then((j) => {
        setDemo(!!j.demo);
        if (j.ok) setStudents(j.data.students);
        else setErr(j.error || "명단을 불러오지 못했어요.");
      })
      .catch(() => setErr("명단을 불러오지 못했어요."));
  }, []);

  const openBouquet = async (s: Student, withPin = "") => {
    setLoading(true);
    setErr("");
    try {
      const j = await (
        await fetch(
          `/api/guestbook?action=bouquet&studentId=${encodeURIComponent(s.id)}&pin=${encodeURIComponent(withPin)}`
        )
      ).json();
      if (!j.ok) {
        setErr(j.error || "꽃다발을 불러오지 못했어요.");
        setEntries(null);
      } else {
        setPicked(s);
        setEntries(j.data.entries);
      }
    } catch {
      setErr("연결에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const saveCard = async () => {
    if (!picked || !entries) return;
    setSaving(true);
    try {
      await downloadBouquetCard({
        studentName: picked.name,
        entries,
        exhibitionName: "진로탐구아카데미 전시",
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "카드를 만들지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 꽃다발 화면 ── */
  if (picked && entries) {
    return (
      <div className="gb-wrap">
        <div className="gb-top">
          <button
            className="gb-back"
            style={{ border: 0, background: "none", cursor: "pointer" }}
            onClick={() => {
              setPicked(null);
              setEntries(null);
              setPin("");
            }}
          >
            ← 다른 사람 고르기
          </button>
          <h1 className="gb-h1">{picked.name}님에게 온 꽃다발</h1>
          <p className="gb-sub">
            꽃 {entries.length}송이가 도착했어요.
            {entries.length > 0 && " 카드로 내려받으면 글도 함께 담깁니다."}
          </p>
        </div>

        {err && <div className="gb-err">{err}</div>}

        <div className="gb-gardenBox">
          <Garden entries={entries} width={720} emptyLabel="아직 도착한 꽃이 없어요" />
        </div>

        <div className="gb-actions">
          <button className="gb-btn gb-btn--rose" onClick={saveCard} disabled={!entries.length || saving}>
            {saving ? "만드는 중…" : "꽃다발 카드 내려받기"}
          </button>
        </div>

        <div className="gb-list" style={{ marginTop: 20 }}>
          {entries.length === 0 && <p className="gb-empty">아직 도착한 꽃이 없어요.</p>}
          {[...entries].reverse().map((e) => (
            <div className="gb-note" key={e.id}>
              <FlowerHead id={e.flower} size={34} />
              <div className="gb-noteBody">
                <p className="gb-noteMsg">{e.message}</p>
                <div className="gb-noteMeta">
                  {e.fromName || "이름을 남기지 않은 손님"} · {e.dateKey}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── 이름 고르기 ── */
  return (
    <div className="gb-wrap">
      <div className="gb-top">
        <Link className="gb-back" href="/guestbook">
          ← 꽃 우체국
        </Link>
        <h1 className="gb-h1">내 꽃다발</h1>
        <p className="gb-sub">이름을 고르면 나에게 온 꽃과 그 말을 볼 수 있어요.</p>
      </div>

      {demo && (
        <div className="gb-demo">
          <strong>데모 모드입니다.</strong> 구글 시트를 연결하기 전이라 예시 명단이 보입니다.
        </div>
      )}
      {err && <div className="gb-err">{err}</div>}

      {students === null ? (
        <p className="gb-empty">명단을 부르는 중이에요…</p>
      ) : students.length === 0 ? (
        <p className="gb-empty">아직 명단이 비어 있어요.</p>
      ) : (
        <div className="gb-grid">
          {students.map((s) => (
            <button
              key={s.id}
              className="gb-student"
              disabled={loading}
              onClick={() => openBouquet(s, pin)}
            >
              <span className="gb-studentName">{s.name}</span>
              {s.group && <span className="gb-studentGroup">{s.group}</span>}
              <span className="gb-studentCount">받은 꽃 {s.flowers}</span>
            </button>
          ))}
        </div>
      )}

      <div className="gb-field" style={{ marginTop: 20 }}>
        <label className="gb-label" htmlFor="gb-pin">
          PIN <span style={{ opacity: 0.7 }}>(선생님이 PIN을 걸어 두었을 때만 필요해요)</span>
        </label>
        <input
          id="gb-pin"
          className="gb-input"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="예: 1234"
        />
      </div>
    </div>
  );
}
