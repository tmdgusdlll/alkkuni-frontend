#!/usr/bin/env bash
# EC2에서 root로 실행한다. ci-cd.yml deploy가 SSM으로 이 커밋의 이 파일을 받아 부른다.
# 사용: bash /opt/alkkuni/web/deploy-web.sh <커밋 sha>
# 흐름은 백엔드 deploy/deploy.sh와 같다: 새 파일을 .next/에 받고, 이미지 pull이 성공한 뒤에만 교체하고,
# 교체 뒤 실패하면 직전 파일(.prev)로 되돌린다. 더 이전으로 돌리려면 그 sha로 다시 실행한다(ECR은 최근 10개만 둔다).
# 백엔드 파일(/opt/alkkuni의 .env·.prev·.next)과 섞이지 않게 /opt/alkkuni/web/ 아래만 쓴다.
set -Eeuo pipefail

SHA=${1:?커밋 sha가 필요하다}
REPO_RAW=https://raw.githubusercontent.com/tmdgusdlll/alkkuni-frontend/$SHA
REGION=ap-northeast-2
# 배포 하나를 이루는 파일. 이미지 태그는 web.env에 있어서 이 묶음을 되돌리면 이미지도 되돌아간다.
FILES=(compose.web.yaml web.env)
mkdir -p /opt/alkkuni/web
cd /opt/alkkuni/web
umask 077
compose() { docker compose -f compose.web.yaml --env-file web.env "$@"; }

# 1. 새 파일을 .next/에 받는다. 레지스트리 주소는 백엔드와 같은 Parameter Store 값을 쓴다(EC2 역할은 GetParameters만 있다).
rm -rf .next && mkdir .next
curl -fsSL "$REPO_RAW/deploy/compose.web.yaml" -o .next/compose.web.yaml
REGISTRY=$(aws ssm get-parameters --region "$REGION" --names /alkkuni/prod/IMAGE_REGISTRY \
  --query 'Parameters[0].Value' --output text)
if [ -z "$REGISTRY" ] || [ "$REGISTRY" = None ]; then
  echo "Parameter Store에 /alkkuni/prod/IMAGE_REGISTRY가 없다" >&2
  exit 1
fi
printf "IMAGE_REGISTRY='%s'\nWEB_TAG='%s'\n" "$REGISTRY" "$SHA" > .next/web.env

# 2. ECR 로그인 후 새 이미지 받기. 여기서 실패하면 서버는 아무것도 바뀌지 않는다.
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"
docker compose -f .next/compose.web.yaml --env-file .next/web.env pull web

# 3. 지금 파일을 .prev/에 두고 새 파일로 바꾼다. 첫 배포면 .prev가 없다.
rm -rf .prev
if [ -f web.env ]; then
  mkdir .prev
  for f in "${FILES[@]}"; do cp -p "$f" ".prev/$f"; done
fi
for f in "${FILES[@]}"; do cp -p ".next/$f" "$f"; done

rollback() {
  trap - ERR
  echo "배포 실패: $SHA" >&2
  # 컨테이너 로그는 EC2에만 남긴다. SSM 출력은 공개 레포의 Actions 로그에 그대로 찍힌다.
  mkdir -p /opt/alkkuni/logs
  compose logs --no-color --tail 200 web > "/opt/alkkuni/logs/deploy-web-$SHA.log" 2>&1 || true
  echo "web 로그: /opt/alkkuni/logs/deploy-web-$SHA.log (EC2에서 확인)" >&2
  if [ ! -d .prev ]; then
    echo "첫 배포라 되돌릴 것이 없다" >&2
    exit 1
  fi
  for f in "${FILES[@]}"; do cp -p ".prev/$f" "$f"; done
  if compose up -d --wait --wait-timeout 120 web; then
    echo "직전 배포로 되돌렸다($(grep '^WEB_TAG=' web.env | cut -d= -f2 | tr -d "'"))" >&2
  else
    echo "롤백도 실패했다. 직접 확인이 필요하다" >&2
  fi
  exit 1
}
trap rollback ERR

# 4. web 교체. 백엔드 네트워크(alkkuni_default)가 없으면 여기서 실패한다(백엔드부터 띄운다).
# ponytail: 교체하는 몇 초 동안 / 가 502다. 무중단이 필요하면 백엔드 "무중단 배포"와 같이 본다.
compose up -d --wait --wait-timeout 120 web

# 5. 백엔드 nginx를 거쳐 확인한다. nginx는 web 주소를 10초마다 다시 풀어(resolver valid=10s) 바뀐 IP를 따라간다.
curl -fsS --retry 10 --retry-delay 2 --retry-all-errors -o /dev/null http://localhost/robots.txt
echo "web 배포 완료: $SHA"
trap - ERR

# 지난 web 이미지 정리(EBS가 차지 않게). 백엔드 이미지는 건드리지 않는다.
# docker image prune의 --filter는 저장소 이름을 받지 않아 목록에서 지금 태그만 빼고 지운다.
docker image ls "$REGISTRY/alkkuni-web" --format '{{.Repository}}:{{.Tag}}' \
  | grep -vx "$REGISTRY/alkkuni-web:$SHA" | xargs -r docker rmi > /dev/null 2>&1 || true
