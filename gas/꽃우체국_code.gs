// ==========================================================
// 꽃 우체국 — 코딩빌리지 방명록 v1.0
//
// 「10점짜리 행복 정원」과 방향이 반대입니다.
//   행복정원 : 학생이 자기 행복을 자기 정원에 심는다
//   꽃 우체국 : 손님이 와서 "학생을 고르고" 그 학생 정원에 꽃을 놓고 간다
//               → 같은 꽃이 「모두의 정원」에도 함께 핀다
//
// ── 설치 순서 ──────────────────────────────
// 1) script.google.com 새 프로젝트 → 이 파일 전체 붙여넣기
// 2) setup() 한 번 실행 (시트가 자동으로 만들어집니다)
// 3) 만들어진 시트의 「학생명단」에 진탐아 학생을 적습니다
//    (id는 비워 두면 setup 때 자동으로 채워집니다. addStudents()를 써도 됩니다)
// 4) 배포 → 새 배포 → 웹 앱
//      실행: 나              접근: 모든 사용자
// 5) 나온 /exec 주소를 Vercel 환경변수 GUESTBOOK_GAS_URL 에 넣습니다
//
// 부적절한 방명록이 올라오면 시트 「방명록」의 hidden 칸에 Y 를 적으면
// 화면에서 즉시 사라집니다. (지우지 말고 가려 두는 편이 안전합니다)
// ==========================================================

var TZ = 'Asia/Seoul';

function getSSS() {
  var id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  return null;
}
function getSS() {
  var ss = getSSS();
  if (!ss) throw new Error('setup()을 먼저 실행해주세요.');
  return ss;
}

// ── 시트 초기화 (최초 1회) ──────────────────
function setup() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SS_ID'), ss;
  if (ssId) { try { ss = SpreadsheetApp.openById(ssId); } catch (e) { ssId = null; } }
  if (!ssId) {
    ss = SpreadsheetApp.create('꽃 우체국 — 방명록 데이터');
    props.setProperty('SS_ID', ss.getId());
    Logger.log('스프레드시트 생성: ' + ss.getUrl());
  }
  initSheet(ss, '학생명단', ['id', 'name', 'group', 'pin', 'note', 'createdAt']);
  initSheet(ss, '방명록', ['id', 'toId', 'toName', 'fromName', 'flower', 'message', 'x', 'scale', 'hidden', 'createdAt']);
  initSheet(ss, '설정', ['key', 'value']);

  var cfg = ss.getSheetByName('설정');
  if (cfg.getLastRow() < 2) {
    cfg.appendRow(['exhibitionName', '진로탐구아카데미 전시']);
    cfg.appendRow(['open', 'Y']);           // N 으로 바꾸면 새 방명록을 받지 않습니다
    cfg.appendRow(['requirePin', 'N']);     // Y 면 학생이 꽃다발을 볼 때 PIN을 묻습니다
  }
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (def && ss.getSheetByName('학생명단') !== def) ss.deleteSheet(def);

  fillMissingIds();
  Logger.log('✅ 완료! 학생명단을 채운 뒤 배포하세요. → ' + ss.getUrl());
}

function initSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** 학생명단에 이름만 적어 두면 id를 자동으로 채워 줍니다. */
function fillMissingIds() {
  var sh = getSS().getSheetByName('학생명단');
  if (sh.getLastRow() < 2) return 0;
  var rng = sh.getRange(2, 1, sh.getLastRow() - 1, 6);
  var rows = rng.getValues(), n = 0;
  for (var i = 0; i < rows.length; i++) {
    if (!String(rows[i][1]).trim()) continue;          // 이름이 없으면 건너뜀
    if (String(rows[i][0]).trim()) continue;           // 이미 id가 있음
    rows[i][0] = 'v_' + Date.now() + '_' + i;
    if (!rows[i][5]) rows[i][5] = new Date().toISOString();
    n++;
  }
  if (n) rng.setValues(rows);
  return n;
}

/** 이름을 한 번에 등록하고 싶을 때 이 함수의 목록만 고쳐 실행하세요. */
function addStudents() {
  var names = ['홍길동', '김철수', '이영희'];   // ← 여기만 고치세요
  var sh = getSS().getSheetByName('학생명단');
  var now = new Date().toISOString();
  names.forEach(function (nm, i) {
    if (!nm || !nm.trim()) return;
    sh.appendRow(['v_' + Date.now() + '_' + i, nm.trim(), '', '', '', now]);
  });
  Logger.log('추가 완료: ' + names.length + '명');
}

// ── 헬퍼 ────────────────────────────────────
function okJson(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function errJson(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(msg) }))
    .setMimeType(ContentService.MimeType.JSON);
}
function cfgGet(key, dflt) {
  var sh = getSS().getSheetByName('설정');
  if (!sh || sh.getLastRow() < 2) return dflt;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) if (String(rows[i][0]) === key) return String(rows[i][1]);
  return dflt;
}
function iso(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return String(v || '');
}
function dateKey(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}

function readStudents() {
  var sh = getSS().getSheetByName('학생명단');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues()
    .filter(function (r) { return String(r[0]).trim() && String(r[1]).trim(); })
    .map(function (r) {
      return { id: String(r[0]).trim(), name: String(r[1]).trim(), group: String(r[2] || '').trim(), pin: String(r[3] || '').trim(), note: String(r[4] || '').trim() };
    });
}

function readEntries(includeHidden) {
  var sh = getSS().getSheetByName('방명록');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues()
    .filter(function (r) { return String(r[0]).trim(); })
    .filter(function (r) { return includeHidden || String(r[8]).toUpperCase() !== 'Y'; })
    .map(function (r) {
      return {
        id: String(r[0]), toId: String(r[1]), toName: String(r[2]),
        fromName: String(r[3] || ''), flower: String(r[4] || 'daisy'),
        message: String(r[5] || ''), x: Number(r[6]) || 0.5, scale: Number(r[7]) || 1,
        hidden: String(r[8]).toUpperCase() === 'Y', createdAt: iso(r[9]), dateKey: dateKey(r[9])
      };
    });
}

// ── 라우터 ──────────────────────────────────
function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = String(p.action || '').toLowerCase();
  try {
    if (action === 'roster') return getRoster();
    if (action === 'garden') return getGarden(p.since);
    if (action === 'bouquet') return getBouquet(p.studentId, p.pin);
    if (action === 'config') return getConfig();
    return errJson('unknown action: ' + action);
  } catch (err) {
    return errJson(err.message);
  }
}

// 꽃 심기는 쓰기라서 POST로 받습니다.
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    var action = String(body.action || '').toLowerCase();
    if (action === 'plant') return plantFlower(body);
    return errJson('unknown action: ' + action);
  } catch (err) {
    return errJson(err.message);
  }
}

// ── 읽기 ────────────────────────────────────
function getConfig() {
  return okJson({
    exhibitionName: cfgGet('exhibitionName', '진로탐구아카데미 전시'),
    open: cfgGet('open', 'Y') !== 'N',
    requirePin: cfgGet('requirePin', 'N') === 'Y'
  });
}

/** 손님이 고를 학생 목록. 각자 받은 꽃 수가 함께 옵니다. */
function getRoster() {
  var students = readStudents();
  var entries = readEntries(false);
  var count = {};
  entries.forEach(function (en) { count[en.toId] = (count[en.toId] || 0) + 1; });
  return okJson({
    total: entries.length,
    students: students.map(function (s) {
      return { id: s.id, name: s.name, group: s.group, note: s.note, flowers: count[s.id] || 0 };
    })
  });
}

/** 모두의 정원 — 태블릿에 띄우는 화면이 씁니다. */
function getGarden(since) {
  var entries = readEntries(false);
  var students = readStudents();
  var byStudent = {};
  entries.forEach(function (en) { byStudent[en.toId] = (byStudent[en.toId] || 0) + 1; });
  return okJson({
    total: entries.length,
    studentCount: students.length,
    latestAt: entries.length ? entries[entries.length - 1].createdAt : '',
    ranking: students
      .map(function (s) { return { name: s.name, flowers: byStudent[s.id] || 0 }; })
      .sort(function (a, b) { return b.flowers - a.flowers; }),
    entries: entries
  });
}

/** 학생이 자기에게 온 꽃다발을 봅니다. */
function getBouquet(studentId, pin) {
  if (!studentId) return errJson('studentId 필요');
  var s = readStudents().filter(function (x) { return x.id === studentId; })[0];
  if (!s) return errJson('그 학생을 찾을 수 없어요.');
  if (cfgGet('requirePin', 'N') === 'Y' && s.pin && String(pin || '') !== s.pin) {
    return errJson('PIN이 맞지 않아요.');
  }
  var mine = readEntries(false).filter(function (en) { return en.toId === studentId; });
  return okJson({ student: { id: s.id, name: s.name, group: s.group }, total: mine.length, entries: mine });
}

// ── 쓰기 ────────────────────────────────────
function plantFlower(body) {
  if (cfgGet('open', 'Y') === 'N') return errJson('지금은 방명록을 받지 않아요.');

  var toId = String(body.toId || '').trim();
  var message = String(body.message || '').trim();
  var fromName = String(body.fromName || '').trim().slice(0, 20);
  var flower = String(body.flower || 'daisy').trim().slice(0, 20);

  if (!toId) return errJson('꽃을 놓을 친구를 골라 주세요.');
  if (!message) return errJson('한 마디를 적어 주세요.');
  if (message.length > 200) return errJson('한 마디는 200자까지예요.');

  var s = readStudents().filter(function (x) { return x.id === toId; })[0];
  if (!s) return errJson('그 학생을 찾을 수 없어요.');

  // 같은 글이 연달아 여러 번 들어오는 것만 막습니다(뒤로가기·이중 탭).
  var recent = readEntries(true).slice(-30);
  for (var i = 0; i < recent.length; i++) {
    if (recent[i].toId === toId && recent[i].message === message && recent[i].fromName === fromName) {
      return okJson({ id: recent[i].id, duplicated: true, toName: s.name });
    }
  }

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (e) { return errJson('잠시 뒤에 다시 눌러 주세요.'); }
  try {
    var sh = getSS().getSheetByName('방명록');
    var id = 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    var x = Math.round(Math.random() * 1000) / 1000;
    var scale = Math.round((0.82 + Math.random() * 0.46) * 100) / 100;
    sh.appendRow([id, toId, s.name, fromName, flower, message, x, scale, '', new Date().toISOString()]);
    return okJson({ id: id, toName: s.name, flower: flower, x: x, scale: scale });
  } finally {
    lock.releaseLock();
  }
}
