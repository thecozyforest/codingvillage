/** 방명록 화면(브라우저)과 서버가 함께 쓰는 타입입니다.
    gas.ts는 서버 전용이라 여기에 따로 두고 양쪽에서 가져다 씁니다. */

export type Entry = {
  id: string;
  toId: string;
  toName: string;
  fromName: string;
  flower: string;
  message: string;
  x: number;
  scale: number;
  createdAt: string;
  dateKey: string;
};

export type Student = {
  id: string;
  name: string;
  group: string;
  note?: string;
  flowers: number;
};
