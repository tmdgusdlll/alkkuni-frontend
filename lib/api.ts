import type { ApiResponse } from "@/types/api";

// 서버(서버 컴포넌트)에는 현재 페이지 주소가 없어 백엔드 주소를 붙인다. 브라우저는 /api 그대로(rewrites·Nginx가 넘김)
function baseUrl() {
  return typeof window === "undefined" ? (process.env.API_URL ?? "http://localhost:8080") : "";
}

/**
 * 백엔드 API를 부른다. path는 "/api/..."로 시작한다.
 * 4xx는 백엔드 에러 본문을 { error }로 돌려줘 화면이 문구를 보여준다(사용자가 고칠 수 있는 요청 문제).
 * 5xx, 백엔드가 꺼져 있음, 본문이 JSON이 아님은 예외를 던져 error.tsx("다시 시도")가 받는다.
 */
export async function api<T>(path: string): Promise<ApiResponse<T>> {
  // 백엔드가 응답 없이 멈추면 "불러오는 중"이 끝나지 않으니 10초에 끊고 error.tsx로 넘긴다
  const res = await fetch(`${baseUrl()}${path}`, { signal: AbortSignal.timeout(10_000) });
  // 500도 JSON 에러 본문으로 오지만 사용자가 고칠 수 없는 일시 오류라 다시 시도로 보낸다
  if (res.status >= 500) throw new Error(`API 서버 오류: ${res.status} ${path}`);
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`API 응답을 읽을 수 없습니다: ${res.status} ${path}`);
  }
}
