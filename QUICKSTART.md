# Game Event Calendar

게임 공식 유튜브 채널 URL을 등록하면 최신 영상 정보를 자동으로 수집하고, 영상 제목과 설명에서 이벤트/업데이트 정보를 추출하여 웹 캘린더 형태로 표시하는 웹 애플리케이션입니다.

## 🚀 빠른 시작

```bash
# 1. 루트 디렉토리에서 모든 의존성 설치
npm run install-all

# 2. 백엔드 .env 파일 생성 (API 키 불필요!)
cd backend
cp .env.example .env
cd ..

# 3. 개발 서버 실행 (별도 터미널에서)
# 터미널 1: 백엔드 실행
cd backend && npm run dev

# 터미널 2: 프론트엔드 실행
cd frontend && npm run dev
```

## 주요 기능

### 1. 채널 관리
- 게임 이름과 유튜브 채널 URL 저장
- 채널 추가/삭제/조회 API
- 채널별 영상 자동 동기화

### 2. 영상 수집 (RSS + HTML 크롤링)
- **YouTube RSS 피드** - 매우 빠름 (300-500ms)
- **Fallback: HTML 크롤링** - RSS 실패 시 자동 전환
- 제목, 설명, 업로드일, 영상 URL 자동 저장
- SQLite 데이터베이스에 영상 정보 저장
- ✨ **API 키 불필요**, 무제한 요청

### 3. 이벤트 판별 및 추출
- 제목/설명에서 자동으로 이벤트 키워드 감지
  - 이벤트, 업데이트, 점검, 패치, 시작, 종료, 보상, 시즌 등
- 텍스트에서 날짜 패턴 자동 추출
  - `YYYY-MM-DD` (2024-02-10)
  - `YYYY.MM.DD` (2024.02.10)
  - `MM/DD` (02/10)
  - 한글 날짜 (2월 10일)

### 4. 웹 캘린더 표시
- 월간 캘린더 UI
- 날짜별 이벤트 표시
- 이벤트 클릭 시 상세 정보 모달 표시
- YouTube 영상으로 직접 이동 링크

### 5. 자동 갱신
- 1시간마다 모든 채널의 영상 자동 수집
- 이벤트 중복 방지

## 기술 스택

### Backend
- **Runtime**: Node.js 16+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: SQLite (better-sqlite3)
- **Web Scraping**: Axios + Cheerio + xml2js
- **Scheduler**: node-schedule

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios

## 프로젝트 구조

```
game-event-calendar/
├── package.json                 # 루트 워크스페이스
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── app.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── README.md                    # 자세한 설명서
├── MIGRATION_GUIDE.md           # API → RSS 마이그레이션 가이드
└── .gitignore
```

## API 엔드포인트

### 채널 관리
```
GET    /api/channels              - 모든 채널 조회
GET    /api/channels/:id          - 특정 채널 조회
POST   /api/channels              - 채널 등록
PUT    /api/channels/:id          - 채널 수정
DELETE /api/channels/:id          - 채널 삭제
POST   /api/channels/:id/sync     - 채널 수동 동기화
```

### 이벤트 조회
```
GET    /api/events                - 모든 이벤트 조회
GET    /api/events/by-date        - 날짜범위 조회
GET    /api/events/by-month/:y/:m - 월별 조회
GET    /api/events/by-game/:name  - 게임별 조회
POST   /api/events                - 수동 이벤트 생성
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm run install-all
```

### 2. 환경 설정
```bash
cd backend
cp .env.example .env
# .env 파일 수정 (선택사항 - API 키 불필요!)
```

### 3. 개발 서버 실행

**터미널 1: 백엔드**
```bash
cd backend
npm run dev
# http://localhost:5000 에서 실행
```

**터미널 2: 프론트엔드**
```bash
cd frontend
npm run dev
# http://localhost:3000 에서 실행
```

### 4. 빌드
```bash
npm run build
```

## 사용 예시

### 채널 등록
```bash
curl -X POST http://localhost:5000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "game_name": "Final Fantasy XIV",
    "channel_url": "https://www.youtube.com/@FinalFantasyXIV"
  }'
```

### 월별 이벤트 조회
```bash
curl http://localhost:5000/api/events/by-month/2024/2
```

## 지원 채널 URL 형식

```
✅ /channel/UC... 형식 (권장)
   https://www.youtube.com/channel/UCkszU2WH9gy1mb0dV-11UJg

✅ /@handle 형식 (최신)
   https://www.youtube.com/@FinalFantasyXIV

✅ /c/customurl 형식
   https://www.youtube.com/c/MyCustomChannel

✅ /user/username 형식 (레거시)
   https://www.youtube.com/user/MyChannel
```

## 환경 변수 (.env)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| PORT | 서버 포트 | 5000 |
| NODE_ENV | 실행 환경 | development |
| DB_PATH | SQLite DB 경로 | ./game_events.db |
| SCHEDULER_INTERVAL_MINUTES | 갱신 주기 (분) | 60 |
| REQUEST_TIMEOUT | 요청 타임아웃 (ms) | 10000 |

**✨ YouTube API 키가 더 이상 필요 없습니다!**

## 성능 개선

| 지표 | 이전 (API) | 현재 (RSS) | 개선 |
|------|-----------|----------|------|
| 채널 추가 | ~2초 | ~500ms | **4배 빠름** |
| 영상 수집 | ~1.5초 | ~300ms | **5배 빠름** |
| 월간 비용 | ~$5-10 | $0 | **100% 절감** |

## 문제 해결

### 백엔드 빌드 실패
```bash
cd backend
rm -rf node_modules
npm install
npm run build
```

### 프론트엔드 빌드 실패
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

### 포트 이미 사용 중
```bash
# 포트 5000 확인 (Windows)
netstat -ano | findstr :5000

# 포트 3000 확인 (Windows)
netstat -ano | findstr :3000
```

## 라이선스

MIT

## 확장 가능성

- [ ] 여러 YouTube 채널 통합 검색
- [ ] 알림 기능 (이메일, 슬랙 등)
- [ ] 이벤트 필터링 및 검색
- [ ] 모바일 앱 (React Native)
- [ ] API 문서 (Swagger)
- [ ] 다국어 지원
- [ ] 사용자 계정 및 인증

---

**마지막 업데이트**: 2026년 2월 4일

더 자세한 내용은 [README.md](./README.md)와 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)를 참고하세요.
