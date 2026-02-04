# Game Event Calendar

게임 공식 유튜브 채널 URL을 등록하면 최신 영상 정보를 자동으로 수집하고, 영상 제목과 설명에서 이벤트/업데이트 정보를 추출하여 웹 캘린더 형태로 표시하는 웹 애플리케이션입니다.

## 주요 기능

### 1. 채널 관리
- 게임 이름과 유튜브 채널 URL 저장
- 채널 추가/삭제/조회 API
- 채널별 영상 자동 동기화

### 2. 영상 수집
- **YouTube RSS 피드**를 사용하여 최신 영상 수집 (매우 빠름)
- **Fallback: HTML 크롤링** (RSS 실패 시)
- 제목, 설명, 업로드일, 영상 URL 자동 저장
- SQLite 데이터베이스에 영상 정보 저장
- API 키 불필요, 무제한 요청

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
- **Runtime**: Node.js
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

### 추가 라이브러리
- **CORS**: cors
- **Environment Variables**: dotenv
- **UUID**: uuid

## 설치 및 실행 가이드

### 필수 요구사항
- Node.js 16.x 이상
- npm 또는 yarn
- ⚠️ **YouTube API 키 불필요** (RSS + HTML 크롤링 사용)

### 1단계: 백엔드 설치 및 설정

```bash
cd backend

# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env

# .env 파일 (선택사항 설정만 필요)
# PORT=5000
# NODE_ENV=development
# DB_PATH=./game_events.db
# SCHEDULER_INTERVAL_MINUTES=60
# REQUEST_TIMEOUT=10000 (선택)
```

**참고**: YouTube API 키가 필요하지 않습니다! RSS 피드와 HTML 크롤링을 사용합니다.

### 2단계: 백엔드 실행

```bash
# 개발 모드 실행
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

백엔드 서버는 `http://localhost:5000`에서 실행됩니다.

### 3단계: 프론트엔드 설치

새로운 터미널에서:

```bash
cd frontend

# 의존성 설치
npm install
```

### 4단계: 프론트엔드 실행

```bash
# 개발 모드 실행
npm run dev
```

프론트엔드 애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 채널 관리

#### GET /api/channels
모든 채널 조회
```
Response: { status: "success", data: Channel[] }
```

#### GET /api/channels/:id
특정 채널 조회
```
Response: { status: "success", data: Channel }
```

#### POST /api/channels
새 채널 등록
```
Request: { game_name: string, channel_url: string }
Response: { status: "success", data: Channel, message: string }
```

#### PUT /api/channels/:id
채널 정보 수정
```
Request: { game_name?: string, channel_url?: string }
Response: { status: "success", data: Channel }
```

#### DELETE /api/channels/:id
채널 삭제
```
Response: { status: "success", message: string }
```

#### POST /api/channels/:id/sync
채널 수동 동기화
```
Response: { status: "success", message: string }
```

### 이벤트 조회

#### GET /api/events
모든 이벤트 조회
```
Response: { status: "success", data: Event[], total: number }
```

#### GET /api/events/by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
날짜 범위로 이벤트 조회
```
Response: { status: "success", data: Event[], total: number }
```

#### GET /api/events/by-month/:year/:month
월별 이벤트 조회 (예: /api/events/by-month/2024/2)
```
Response: { status: "success", data: Event[], total: number }
```

#### GET /api/events/by-game/:gameName
게임별 이벤트 조회
```
Response: { status: "success", data: Event[], total: number }
```

#### GET /api/events/:id
특정 이벤트 조회
```
Response: { status: "success", data: Event }
```

#### POST /api/events
수동 이벤트 생성
```
Request: { game_name: string, title: string, start_date: string, end_date?: string, description?: string, source_url: string }
Response: { status: "success", data: Event, message: string }
```

#### PUT /api/events/:id
이벤트 수정
```
Request: Event의 부분 정보
Response: { status: "success", data: Event }
```

#### DELETE /api/events/:id
이벤트 삭제
```
Response: { status: "success", message: string }
```

## 데이터베이스 스키마

### channels 테이블
```sql
CREATE TABLE channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_name TEXT NOT NULL UNIQUE,
  channel_url TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### videos 테이블
```sql
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  published_at DATETIME NOT NULL,
  video_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
);
```

### events 테이블
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  game_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  source_url TEXT NOT NULL,
  video_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(video_id)
);
```

## 프로젝트 구조

```
game-event-calendar/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # SQLite 설정
│   │   │   └── youtube.ts           # YouTube API 설정
│   │   ├── models/
│   │   │   ├── Channel.ts           # 채널 데이터 모델
│   │   │   └── Event.ts             # 이벤트 데이터 모델
│   │   ├── services/
│   │   │   ├── YouTubeService.ts    # YouTube API 연동 및 이벤트 추출
│   │   │   └── SchedulerService.ts  # 자동 갱신 스케줄러
│   │   ├── routes/
│   │   │   ├── channels.ts          # 채널 API 라우트
│   │   │   └── events.ts            # 이벤트 API 라우트
│   │   ├── middleware/
│   │   │   └── errorHandler.ts      # 에러 핸들링 미들웨어
│   │   └── app.ts                   # Express 앱 진입점
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar.tsx         # 캘린더 컴포넌트
│   │   │   ├── EventModal.tsx       # 이벤트 상세 모달
│   │   │   ├── ChannelManager.tsx   # 채널 관리 UI
│   │   │   └── Header.tsx           # 헤더 컴포넌트
│   │   ├── services/
│   │   │   └── api.ts               # API 클라이언트
│   │   ├── App.tsx                  # 메인 애플리케이션
│   │   ├── main.tsx                 # React 진입점
│   │   └── index.css                # 전역 스타일
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tsconfig.node.json
│
└── README.md                         # 프로젝트 설명서
```

## 주요 기능 설명

### 이벤트 추출 알고리즘

1. **키워드 매칭**: 영상 제목과 설명에서 이벤트 관련 키워드 검색
2. **날짜 추출**: 정규식을 통해 여러 형식의 날짜 패턴 감지
3. **이벤트 생성**: 매칭된 날짜와 함께 이벤트 레코드 생성

### 자동 갱신 스케줄러

- 설정된 간격(기본 1시간)마다 모든 채널 정보 업데이트
- 중복된 이벤트는 자동으로 필터링
- 에러 발생 시 로그 기록 후 다음 주기 계속 실행

## 사용 예시

### 1. 채널 등록

```bash
curl -X POST http://localhost:5000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "game_name": "Final Fantasy XIV",
    "channel_url": "https://www.youtube.com/@FinalFantasyXIV"
  }'
```

### 2. 이벤트 조회 (2024년 2월)

```bash
curl http://localhost:5000/api/events/by-month/2024/2
```

### 3. 웹 UI 접근

브라우저에서 `http://localhost:3000` 방문

## YouTube 영상 수집 방식

### 1단계: RSS 피드 (권장)
```
YouTube 채널 → RSS URL 생성 → xml2js로 파싱 → 영상 추출
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

**장점:**
- ⚡ 매우 빠름 (300-500ms)
- 🔓 공개 채널 모두 지원
- 📡 실시간 업데이트 (5-10분 지연)

### 2단계: HTML 크롤링 (Fallback)
```
YouTube 채널 페이지 → Cheerio로 파싱 → 영상 링크 추출
```

**언제 사용:**
- RSS 피드 요청 실패 시
- 대체 방법으로 영상 정보 수집

**장점:**
- 🛡️ RSS 실패 시 안정성 제공
- 🔄 자동 Fallback (사용자 개입 없음)

### 채널 URL 형식 지원

다양한 YouTube 채널 URL 형식 지원:

```
✅ /channel/UC... 형식 (권장)
   https://www.youtube.com/channel/UCkszU2WH9gy1mb0dV-11UJg

✅ /@handle 형식 (최신 형식)
   https://www.youtube.com/@FinalFantasyXIV

✅ /c/customurl 형식
   https://www.youtube.com/c/MyCustomChannel

✅ /user/username 형식 (레거시)
   https://www.youtube.com/user/MyChannel
```

**주의**: 채널ID 직접 입력 불가 → URL 형식 필요

## 에러 처리

모든 API 응답은 다음 형식을 따릅니다:

**성공 응답**
```json
{
  "status": "success",
  "data": {},
  "message": "Optional message"
}
```

**에러 응답**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description"
}
```

## 환경 변수

### 백엔드 (.env)

| 변수 | 설명 | 기본값 | 필수 |
|------|------|--------|------|
| `PORT` | 서버 포트 | `5000` | ❌ |
| `NODE_ENV` | 실행 환경 | `development` | ❌ |
| `DB_PATH` | SQLite DB 경로 | `./game_events.db` | ❌ |
| `SCHEDULER_INTERVAL_MINUTES` | 갱신 주기 (분) | `60` | ❌ |
| `REQUEST_TIMEOUT` | HTTP 요청 타임아웃 (ms) | `10000` | ❌ |

**✨ 더 이상 `YOUTUBE_API_KEY`가 필요 없습니다!**

## 개발 팁

### TypeScript 타입 검사
```bash
# 백엔드
cd backend
npm run typecheck

# 프론트엔드
cd frontend
npm run typecheck
```

### 빌드
```bash
# 백엔드
npm run build

# 프론트엔드
npm run build
```

## 라이선스

MIT

## 지원 및 버그 리포트

문제 발생 시 다음 정보를 함께 제공해주세요:
- 오류 메시지
- 사용 중인 OS 및 Node.js 버전
- 재현 단계

## 확장 가능성

미래에 추가 가능한 기능:

- [ ] 여러 YouTube 채널의 영상 통합 검색
- [ ] 알림 기능 (이메일, 슬랙 등)
- [ ] 이벤트 필터링 및 검색
- [ ] 사용자 정의 캘린더 테마
- [ ] 모바일 앱 (React Native)
- [ ] API 문서 (Swagger/OpenAPI)
- [ ] 다국어 지원
- [ ] 사용자 계정 및 인증

---

**마지막 업데이트**: 2024년 2월
