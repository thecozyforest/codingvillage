import Link from "next/link";

/**
 * 방명록 화면들의 이동 줄.
 *
 * 「마을로」는 **어느 화면에나 있어야 합니다.** 전시장에서는 길을 잃으면
 * 되돌아갈 방법이 브라우저 뒤로가기뿐인데, QR로 바로 들어온 사람에게는
 * 그마저 없습니다.
 *
 * children 에는 그 화면에만 필요한 뒤로가기를 넣습니다(없어도 됩니다).
 */
export function GbNav({ children }: { children?: React.ReactNode }) {
  return (
    <nav className="gb-nav" aria-label="이동">
      <Link className="gb-navBtn gb-navBtn--home" href="/">
        <svg viewBox="0 0 16 16" aria-hidden="true" width="13" height="13">
          <path
            d="M2 7.4 8 2.4l6 5V14H10v-3.6H6V14H2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        마을로
      </Link>
      {children}
    </nav>
  );
}
