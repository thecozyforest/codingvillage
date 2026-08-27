# CLAUDE.md — 코딩빌리지

도치쌤(기경민)이 **진로탐구아카데미 전시**에 아이들과 함께 내놓는 링크트리입니다.
cozyforest(개인 포트폴리오)와는 **별개의 프로젝트**입니다. 섞지 않습니다.

핵심은 하나입니다. **이건 앱이 아니라 링크트리입니다.** 앱은 이미 따로 있고,
이 사이트는 그 앱들로 가는 길을 마을 지도처럼 보여 주는 역할만 합니다.
"여기에 기능을 넣자"는 방향으로 커지지 않게 지킵니다. (예외: 꽃 우체국 방명록 — 아래 참고)

Next.js 16 App Router + TypeScript, CSS는 순수 CSS 한 장(`src/app/globals.css`)입니다.

## 구조

```
src/
├─ content/village.json        ← 콘텐츠는 전부 여기. 수정 요청은 대부분 이 파일만 고치면 됨
├─ lib/village.ts              ← 타입 + 계절 계산 + 지도 좌표 계산
├─ components/VillageMap.tsx   ← 화면 전체. "use client"
└─ app/
   ├─ layout.tsx               ← 메타데이터·OG·글꼴
   ├─ page.tsx                 ← VillageMap 렌더만
   └─ globals.css              ← :root 변수 → 색 전부 여기서 통제
```

## 지도가 그려지는 방식

좌표를 손으로 적지 않습니다. `places` 배열의 **순서에서 계산**합니다(`lib/village.ts`).

- `stopY(i)` — i번째 정거장의 세로 위치
- `roadX(i)` / `placeX(i)` — 길과 건물이 **서로 반대쪽**에 앉도록 좌우 교대
- `roadPath(n)` — 정거장들을 잇는 굽은 길. 건물 수가 바뀌면 길이도 따라 늘어남
- `mapHeight(n)` — SVG 세로. 지도는 `viewBox 0 0 360 H` 안에서만 계산되고,
  화면에서는 `max-width: 560px`로 통째로 비례 축소됩니다(폰에서 그대로 읽힘)

건물은 SVG 안이 아니라 **지도 위에 얹은 진짜 `<button>`** 입니다. 탭 영역·포커스·낭독기 때문입니다.
`.cv-layer` 안에서 `left`/`top`을 퍼센트로 잡고, 같은 좌표 계산을 그대로 씁니다.

**건물을 추가·삭제할 때 CSS나 좌표를 손댈 필요가 없습니다.** JSON만 고칩니다.

## 작업 규칙

- 콘텐츠 수정 요청("링크 추가", "문구 바꿔줘")은 `src/content/village.json`만 고친다. 컴포넌트를 건드리지 않는다.
- **`href`가 비면 자동으로 「준비 중」**이다(`statusOf`). `status`를 손으로 `soon`이라 적지 않는다.
- 새 건물 그림은 `BuildingArt`에 `viewBox="0 0 100 100"` 기준으로 그린다. 이 상자를 지켜야 지도 위 크기가 맞는다.
- 색은 `globals.css`의 `:root` / `.cv-root[data-season]` 변수만 고친다. 개별 규칙에 색을 박지 않는다.
- CSS 클래스 접두어는 `cv-`로 통일한다(cozyforest는 `cf-`. 두 프로젝트의 CSS를 섞지 않는다).
- `body`의 `overflow-x: clip`을 `hidden`으로 되돌리지 않는다.
- 수정 후 `npm run build`로 타입·빌드를 확인한다.

## 계절 — 행복정원과 맞춰 둔 부분

`lib/village.ts`의 `weekKey` / `seasonOfWeek`은 「10점짜리 행복 정원」 `code.gs`의
`getWeekKey` / `keyToSeason`을 **그대로 옮긴 것**입니다(`(연*53 + 주차) % 4`).
같은 주에 마을과 정원의 계절이 어긋나면 아이들이 헷갈리므로, 한쪽만 고치지 않습니다.

서버(UTC)와 브라우저가 다른 답을 내지 않도록 날짜는 `Asia/Seoul`로 고정해 계산합니다.
첫 렌더는 `봄`으로 그린 뒤 `useEffect`에서 이번 주 계절로 맞춥니다 — **하이드레이션 불일치를 피하려는 것**이니
`useState(() => currentSeason())`으로 되돌리지 않습니다.

## 접근성 — 전시장에서 실제로 걸렸던 것들

- 「준비 중」인 건물에서도 **「다음 →」이 남아 있어야** 마을 투어가 멈추지 않는다.
  (한 번 이것 때문에 투어가 행복정원에서 막혔다. 시트의 버튼을 조건부로 나눌 때 주의.)
- 시트가 열리면 `body`를 잠그고 시트로 포커스를 옮기며, Esc로 닫고 원래 버튼으로 포커스를 돌려준다.
- 확대를 막지 않는다(`viewport`에 `maximumScale`을 넣지 않는다). 전시장에서 아이들이 키워서 본다.

## 컨텍스트 앵커

- **intent**: 진로탐구아카데미 전시에서 아이들이 QR로 들어와 앱 몇 개를 차례로 체험하게 하는 링크트리. 세로 버튼 목록 대신 마을 지도 형태.
- **decisions**: 기존 앱은 새로 만들지 않고 링크만 건다(꽃 우체국만 예외로 직접 만듦) / 좌표는 순서에서 계산해 JSON만으로 건물 추가 가능 / 계절 규칙은 행복정원과 공유 / 저장소는 GAS+구글시트(선생님이 시트에서 바로 관리할 수 있어서) / 배포는 새 GitHub 저장소 + Vercel
- **open**: 「작은 행복정원」 배포 주소 미확보(현재 `href` 비어 있어 「준비 중」으로 표시됨) / GAS 미배포라 방명록은 데모 모드 / 아이들이 체험할 앱을 더 넣을지 미정
- **next_steps**: 행복정원 주소 채우기 → GAS 배포하고 `GUESTBOOK_GAS_URL` 채우기 → 학생명단 입력 → GitHub·Vercel 연결 → 전시장 QR 만들기

## 꽃 우체국(방명록)

**행복정원과 방향이 반대입니다.** 학생이 자기 행복을 심는 게 아니라,
**손님이 와서 학생을 고르고 그 학생 정원에 꽃을 놓고 갑니다.**
이 방향을 뒤집지 마세요. UI도 행복정원과 일부러 다르게 두었습니다(이모지 대신 직접 그린 꽃).

```
src/
├─ lib/flowers.ts        ← 꽃 도감. 꽃 하나 = 회전한 타원 묶음
├─ lib/card.ts           ← 카드 내려받기(canvas)
├─ lib/gas.ts            ← GAS 다리 + 데모 저장소 (서버 전용)
├─ lib/gardenTypes.ts    ← 브라우저·서버가 함께 쓰는 타입
├─ components/Flower.tsx      ← SVG 꽃 (FlowerHead / FlowerStem)
├─ components/Garden.tsx      ← 정원 그림 (모두의 정원·내 꽃다발 공용)
├─ components/GuestbookVisitor.tsx ← 손님 3단계
├─ components/AllGarden.tsx        ← 모두의 정원 (board 프롭이면 태블릿용)
├─ components/MyBouquet.tsx        ← 학생 꽃다발
├─ app/api/guestbook/route.ts      ← GET(roster·garden·bouquet) / POST(plant)
└─ app/guestbook/…                 ← / · /board · /garden · /mine
gas/꽃우체국_code.gs      ← 구글 앱스 스크립트(사용자가 직접 배포)
```

### 반드시 지킬 것

- **꽃은 한 곳에만 정의한다.** `lib/flowers.ts`의 `FLOWERS`를 화면(SVG)과 카드(canvas)가
  같이 읽습니다. 타원만 쓰는 이유가 이것입니다(`ctx.ellipse`와 `<ellipse>`가 같은 인자를 받음).
  카드용 그림을 따로 그리기 시작하면 반드시 어긋납니다.
- **카드에는 글이 들어가야 한다.** 행복정원 포토카드의 결함(꽃만 그리고 `e.text`를 안 그림)을
  뒤집는 것이 이 기능의 존재 이유입니다. 글을 빼는 방향으로 «간소화»하지 마세요.
- **브라우저에서 GAS를 직접 부르지 않는다.** CORS에 걸립니다. 항상 `/api/guestbook`을 거칩니다.
- GAS로 쓰기(`plant`)는 POST, 읽기는 GET입니다. GAS는 본문을 `text/plain`으로 받아야
  `e.postData.contents`에 그대로 들어옵니다.
- `GUESTBOOK_GAS_URL`이 없으면 데모 모드입니다. **데모 저장소는 서버 메모리라 Vercel에서는 신뢰할 수 없습니다.**
  전시 전에 반드시 GAS를 연결해야 합니다.

### 화면에서 실제로 걸렸던 것들

- **태블릿 화면(`/guestbook/board`)은 스크롤이 생기면 안 된다.** `.gb-board`는 `height: 100dvh`,
  `.gb-boardStage`는 `min-height: 0` + 안쪽 SVG를 `position:absolute; inset:0`로 못 박습니다.
  이걸 풀면 그림이 칸을 밀어내 페이지가 넘칩니다.
- 정원의 밭고랑은 **아래에 붙고 남는 자리가 하늘**이 됩니다(`Garden`의 `groundYOf`).
  위에 붙이면 세로로 긴 태블릿에서 정원이 조그맣게 뜹니다.
- 무대 비율은 `ResizeObserver`로 재지만, **먼저 `getBoundingClientRect()`로 한 번 직접 잽니다.**
  ResizeObserver는 화면을 그리는 단계에서만 불려서, 탭이 뒤에 있으면 한 번도 안 불릴 수 있습니다.
- 입력칸 글자는 **16px 밑으로 내리지 않습니다.** iOS에서 입력할 때 화면이 확대됩니다.

## 전시 윤리 — 되돌리지 말 것

- **받은 꽃 개수를 화면에 쓰지 않는다.** 꽃을 놓는 화면, 내 꽃다발 명단, 정원별 보기 어디에도
  숫자를 붙이지 않습니다. 숫자가 보이면 **적게 받은 아이가 드러나고**, 고르는 손님의 선택도 그쪽으로 쏠립니다.
  (API 응답에는 `flowers` 가 남아 있지만 화면에서 쓰지 않습니다. 「보기 좋으라고」 되살리지 마세요.)
- **정원별 보기는 언제나 이름순**입니다. 꽃 수로 정렬하면 그게 곧 순위표입니다.
  `AllGarden`의 `plots` 는 `localeCompare(…, "ko")` 로만 정렬합니다.
- 꽃을 하나도 못 받은 사람의 정원도 **똑같이 한 칸을 차지**합니다. 빈 정원은 그냥 아직 안 핀 정원으로 보입니다.

## 한글 줄바꿈

전시장에서 폰으로 읽는 화면이라 줄바꿈이 특히 눈에 띕니다.

- `word-break: keep-all` — **이게 없으면 한글이 어절 중간에서 잘립니다**(`환영해` / `요`).
  `globals.css` 의 `body` 와 `guestbook.css` 의 `.gb` 양쪽에 걸려 있습니다. 지우지 마세요.
- `overflow-wrap: break-word` 는 그 예외입니다. 긴 주소처럼 끊을 데가 없는 것만 끊어 줍니다.
- **짧은 덩어리(제목·안내문)에는 `text-wrap: balance`**, 길이를 모르는 사용자 글(방명록 본문)에는 `pretty`.
  balance 는 줄 길이를 고르게 맞추고, pretty 는 마지막 줄에 한 글자만 남는 것을 막습니다.
- 그래도 **의미 단위가 쪼개지면**(예: 「코딩 / 마을」) `village.json` 의 문구에 `\n` 을 넣어 직접 끊습니다.
  `.cv-title` 은 `white-space: pre-line` 이라 `\n` 이 그대로 줄바꿈이 됩니다.
  문구를 고칠 때는 `\n` 자리도 같이 봐야 합니다.

## 이름

전시명과 마을 이름은 **`village.json` 의 `meta` 한 곳**에서 나옵니다.
`meta.exhibition` 은 카드에도 찍히고, `meta.siteName` 은 탭 제목과 뒤로가기 문구에 쓰입니다.
컴포넌트에 문자열로 박지 마세요(예전에 카드 두 곳에 박혀 있었습니다).
