@AGENTS.md

# CLAUDE.md

알꾼이 프론트엔드(Next.js). 백엔드는 옆 폴더 `../alkkuni-backend`, 전체 계획은 그 레포의 `docs/PLANNING.md`에 있다.

**작업을 시작할 때 `docs/PROGRESS.md`를 먼저 읽는다.** "지금 상태"에서 체크 안 된 첫 항목이 다음 작업이고, "다음 할 일"에 정할 것과 검증 기준이 있다. 진행 기록은 작업 PR 안에서 갱신한다(머지 후 문서만 고치는 변경을 만들지 않는다). 섹션별 갱신 방법은 `PROGRESS.md` 상단 규칙을 따른다.

## 명령어

```bash
npm run dev     # 개발 서버 (localhost:3000)
npm run build   # 빌드
npm run lint    # 린트
```

로컬에서 API를 붙이려면 백엔드를 먼저 띄운다(`../alkkuni-backend`에서 `docker compose up -d db`, `./gradlew :api:bootRun`).

## API 호출

- 브라우저는 `/api/...`(같은 출처)로 부른다. 로컬은 `next.config.ts`의 rewrites가 `localhost:8080`으로 넘기고, 운영은 Nginx가 `/api/*`를 api 컨테이너로 보낸다. 그래서 CORS 설정이 필요 없다.
- 브라우저 코드에서 `http://localhost:8080/...`처럼 전체 주소로 부르지 않는다. 다른 출처가 돼 CORS에 막힌다.
- 서버 컴포넌트에는 현재 페이지 주소가 없어 `/api/...`가 안 된다. `${API_URL}/api/...`로 백엔드를 직접 부른다(서버끼리라 CORS 무관).
- 백엔드 주소는 `API_URL` 환경 변수(기본값 `http://localhost:8080`, 운영은 `http://api:8080`). 로컬은 `.env` 없이 동작한다.
- `NEXT_PUBLIC_` 변수는 `next build` 때 JS에 박혀 환경마다 바꿀 수 없다. 쓰지 않는다.

## 디자인

`DESIGN.md`를 따른다(색, 배지, 함량 표시, 화면별 초안).

## 작업 규칙

- 답변과 주석은 한국어로 쓴다.
- `main`에 직접 커밋하지 않는다. 작업마다 브랜치(`feat/...`, `fix/...`, `chore/...`)를 만들고 PR로 머지한다.
- 커밋·푸시·PR 생성은 각각 사용자 승인을 받는다.
- "완료"라고 하기 전에 `npm run build`와 `npm run lint` 결과를 보여준다.
