# PROGRESS.md

알꾼이 프론트엔드의 진행 상황이다. **작업 PR 안에서 갱신하고, 머지되면 확정된다.** 머지 후 문서만 고치는 변경을 만들지 않는다.

- PR을 올리기 전: 작업 커밋에 결정 이유, 다음 할 일 정리 등 이미 아는 내용을 넣는다.
- PR을 올린 뒤 머지 전: PR 번호는 PR 생성 후 첫 커밋(보통 `/code-review` 반영 커밋)에 함께 넣는다. 반영할 게 없을 때만 번호 커밋을 따로 한다.

섹션:

- 지금 상태: 화면 단위 목차. 체크 안 된 첫 항목이 다음 작업이다. 해당 PR에서 체크한다.
- 다음 할 일: 지금 작업에서 정할 것과 검증 기준. 끝난 항목은 지우고 "완료"에 날짜와 함께 옮긴다.
- 작업 로그: 결정과 그 이유. 최근 날짜가 위에 온다.

전체 계획(작업 단계, 화면·API 결정)은 백엔드 `docs/PLANNING.md`, `docs/PROGRESS.md`에 있다. 프론트에서 정한 것만 여기 적고, 백엔드 계획이 바뀌어야 하면 백엔드 PR로 고친다.

## 지금 상태

### 작업 순서 (2026-11-09 정함)

API가 이미 있는 공개 화면부터 만든다. 로그인이 필요한 화면은 백엔드 3단계(인증·서랍) 뒤다. 순서와 범위는 `DESIGN.md` "MVP 범위", `docs/design/components.md` "작업 순서 제안"을 따른다.

- [x] 레포 기본 설정: `/api` rewrites, `CLAUDE.md`, 디자인 문서·색 토큰 (PR #1)
- [ ] **검색** `/search` (`GET /api/products`)
  - Pretendard 글꼴, 공통 `api()` 함수, 응답 타입, 레이아웃(헤더·푸터), 배지·수치 공통 컴포넌트
- [ ] 제품 상세 `/products/[id]` (`GET /api/products/{id}`)
- [ ] 성분별 제품 목록 `/explore` (`GET /api/products/explore`, `GET /api/ingredients`)
- [ ] 제품 비교 `/compare?ids=` (`GET /api/products/compare`)
- [ ] 메인 `/` (검색 히어로. 인기 성분 비교는 백엔드 API가 생기면)
- [ ] 배포: Dockerfile, CI(ECR 푸시, EC2 `WEB_TAG` 교체). 운영 compose·Nginx는 백엔드 레포 `deploy/`
- [ ] 로그인 이후: 로그인, 내 서랍, 알림 설정

## 다음 할 일

### 검색 화면 (`feat/search`)

- 정할 것
  - Pretendard 설치 방식(`pretendard` 패키지 + `next/font/local`, `docs/design/components.md` 1번)
  - 공통 `api()`: 서버에서는 `API_URL`을 붙이고, 응답 `ApiResponse`의 `data`를 꺼내며, 에러 응답(`INVALID_INPUT` 등)을 화면에 보여줄 수 있는 형태로 돌려준다
  - 검색어가 성분이 아닐 때(`matchedIngredient` null) 함량 칸과 "함량순" 정렬을 숨김
- 검증
  - 백엔드를 띄우고 `/search?q=비타민C`가 결과를 보여줌. `sort=amount`, `q=종근당`, `q=C`(에러 문구) 각각 확인
  - 배지(`basisCheck`), 검수 대기(`parseStatus`), 1일 함량 없음 표시를 실제 데이터로 확인(Playwright 스크린샷)
  - `npm run build`, `npm run lint` 통과

## 완료

- 2026-11-09 레포 기본 설정 (PR #1)

## 작업 로그

### 2026-11-09

- 레포 기본 설정 (PR #1)
  - CORS를 백엔드에 넣지 않았다. 브라우저는 같은 출처 `/api`로만 부르고, 로컬은 Next rewrites, 운영은 Nginx가 api로 넘긴다. 서버 컴포넌트는 `API_URL`로 백엔드를 직접 부른다(서버끼리라 CORS 무관). 다른 도메인에서 API를 부를 일이 생기면 그때 넣는다.
  - `NEXT_PUBLIC_` 환경 변수는 쓰지 않는다. `next build` 때 값이 박혀 이미지 하나로 환경을 바꿀 수 없다.
  - 디자인 기준은 사용자 초안 PNG(`../../alkkuni-docs/프론트 초안/`)와 그걸 바탕으로 Claude 디자인이 만든 문서다. 생성 문서는 백엔드 코드를 보지 않고 만들어져 API와 맞지 않는 곳을 고쳤다: `PER_SERVING`을 "표시 기준량당"으로 반대로 정의, 지어낸 타입(IU 환산, 회수일·공지 링크, 구매 링크, 구조화된 기능성), 성분 비교가 한 화면(`/explore`와 `/compare?ids=`로 나뉘었음). 타입은 백엔드 DTO를 그대로 옮긴다.
  - 소셜 로그인은 OAuth 경로(`/oauth2/authorization/*`, `/login/oauth2/code/*`)가 `/api` 밖이라, 로그인 작업 때 rewrites·Nginx에 경로를 추가하고 각 콘솔의 리다이렉트 URI를 다시 본다.
