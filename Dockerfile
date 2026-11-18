# 운영 web 이미지. CI(ci-cd.yml deploy)가 ARM 러너에서 linux/arm64로 빌드해 ECR alkkuni-web에 올린다.
# 빌드에 백엔드가 필요 없다(API 호출은 요청 때만 일어남, ci-cd.yml 참고). API_URL은 실행 때 compose가 넣는다.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# standalone은 필요한 node_modules만 담은 server.js 묶음이다. .next/static은 따로 복사해야 server.js가 내준다.
# public/ 폴더가 생기면 여기에 COPY를 더한다(지금은 없음).
FROM node:24-alpine
WORKDIR /app
# HOSTNAME: Docker가 컨테이너 id를 넣어 두는데 server.js가 그 주소로만 열려 헬스 체크(127.0.0.1)가 닿지 않는다
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
# node 사용자가 .next/cache(캐시된 페이지)를 쓸 수 있게 소유자를 바꾼다
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
