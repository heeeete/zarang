import { headers } from 'next/headers';

/**
 * 미들웨어(proxy.ts)에서 설정한 x-user-id 헤더를 통해 현재 로그인한 유저의 ID를 가져옵니다.
 * 서버 컴포넌트(RSC) 전용 함수입니다.
 * 
 * @returns 유저 ID 문자열 또는 로그인이 안 된 경우 null
 */
export async function getServerUserId(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get('x-user-id');
}
