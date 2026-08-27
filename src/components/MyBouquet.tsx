"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Garden } from "./Garden";
import { FlowerHead } from "./Flower";
import { downloadBouquetCard } from "@/lib/card";
import { village } from "@/lib/village";
import type { Entry, Student } from "@/lib/gardenTypes";

/**
 * 전시가 끝난 뒤, 학생이 자기에게 온 꽃다발을 확인하고 내려받는 화면입니다.
 *
 * 남의 꽃다발을 열지 못하게 이름을 고른 뒤 PIN을 받습니다.
 * PIN을 실제로 검사하는 건 GAS 쪽이고, 시트 「설정」의 requirePin 이 Y 일 때만 걸립니다.
 * 받은 꽃 개수는 어느 화면에서도 보여 주지 않습니다(적게 받은 사람이 드러나므로).
 */
export default function MyBouquet() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [pinOn, setPinOn] = useState<boolean | null>(null);

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

    fetch("/api/guestbook?action=config")
      .then((r) => r.json())
      .then((j) => setPinOn(j.ok ? !!j.data.requirePin : null))
      .catch(() => setPinOn(null));
  }, []);

  const openBouquet = async () => {
    if (!picked) return;
    setLoading(true);
    setErr("");
    try {
      const j = await (
        await fetch(
          `/api/guestbook?action=bouquet&studentId=${encodeURIComponent(picked.id)}&pin=${encodeURIComponent(pin)}`
        )
      ).json();
      if (!j.ok) {
        setErr(j.error || "꽃다발을 불러오지 못했어요.");
        setEntries(null);
      } else {
        setEntries(j.data.entries);
      }
    } catch {
      setErr("연결에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setPicked(null);
    setEntries(null);
    setPin("");
    setErr("");
  };

  const saveCard = async () => {
    if (!picked || !entries) return;
    setSaving(true);
    try {
      await downloadBouquetCard({
        studentName: picked.name,
        entries,
        exhibitionName: village.meta.exhibition,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "카드를 만들지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  /* ── ③ 꽃다발 ── */
  if (picked && entries) {
    return (
      <div className="gb-wrap">
        <div className="gb-top">
          <button className="gb-backBtn" onClick={backToList}>
            ← 처음으로
          </button>
          <h1 className="gb-h1">{picked.name}님에게 온 꽃다발</h1>
          <p className="gb-sub">
            {entries.length > 0
              ? "카드로 내려받으면 꽃과 함께 남겨 준 말도 담깁니다."
              : "아직 도착한 꽃이 없어요."}
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

  /* ── ② PIN 확인 ── */
  if (picked) {
    return (
      <div className="gb-wrap">
        <div className="gb-top">
          <button className="gb-backBtn" onClick={backToList}>
            ← 이름 다시 고르기
          </button>
          <h1 className="gb-h1">{picked.name}님이 맞나요?</h1>
          <p className="gb-sub">
            {pinOn === false
              ? "지금은 PIN 없이 열립니다. 그냥 「열기」를 눌러 주세요."
              : "선생님께 받은 PIN을 넣어 주세요."}
          </p>
        </div>

        {err && <div className="gb-err">{err}</div>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            openBouquet();
          }}
        >
          <div className="gb-field">
            <label className="gb-label" htmlFor="gb-pin">
              PIN
            </label>
            <input
              id="gb-pin"
              className="gb-input"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={pin}
              onChange={(ev) => setPin(ev.target.value)}
              placeholder={pinOn === false ? "필요 없어요" : "예: 1234"}
              autoFocus
            />
          </div>

          <div className="gb-actions">
            <button className="gb-btn gb-btn--go" type="submit" disabled={loading}>
              {loading ? "여는 중…" : "열기"}
            </button>
          </div>
        </form>

        {pinOn === false && (
          <p className="gb-teacherNote">
            선생님께 — 지금은 이름만 고르면 누구나 열 수 있는 상태입니다. 시트 「설정」의{" "}
            <code>requirePin</code> 을 <code>Y</code> 로 바꾸고 「학생명단」의 <code>pin</code> 칸을 채우면
            자기 것만 열립니다.
          </p>
        )}
      </div>
    );
  }

  /* ── ① 이름 고르기 ── */
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
            <button key={s.id} className="gb-student" onClick={() => setPicked(s)}>
              <span className="gb-studentName">{s.name}</span>
              {s.group && <span className="gb-studentGroup">{s.group}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
