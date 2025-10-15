# Cyber Garden 프로젝트 구현 계획

## 프로젝트 개요
Next.js, Supabase, shadcn/ui, Lucide Icons, Zod, Zustand, BlockNote를 사용한 커뮤니티 웹사이트

## 기술 스택
- **Frontend**: Next.js (App Router), React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide Icons
- **Editor**: BlockNote
- **State Management**: Zustand
- **Validation**: Zod
- **Backend/DB**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel
- **Font**: Google Fonts (깔끔한 폰트 선정)

## 단계별 구현 계획

### Phase 1: 프로젝트 초기 설정
- [ ] 1.1 Next.js 프로젝트 초기화
- [ ] 1.2 필요한 패키지 설치 (shadcn/ui, zustand, zod, blocknote, etc.)
- [ ] 1.3 Tailwind CSS 및 폰트 설정
- [ ] 1.4 프로젝트 폴더 구조 설정
- [ ] 1.5 환경변수 설정 (.env.local)
- [ ] 1.6 Git 초기화 및 GitHub 연동

### Phase 2: Supabase 설정
- [ ] 2.1 Supabase 데이터베이스 스키마 설계
  - users 테이블 (확장 프로필 정보)
  - posts 테이블
  - comments 테이블
  - categories 테이블
  - post_images 테이블
  - post_ups 테이블 (up 버튼)
  - comment_likes 테이블 (하트)
  - notifications 테이블
- [ ] 2.2 Supabase SQL 마이그레이션 작성
- [ ] 2.3 Storage 버킷 생성 (profile-images, post-images)
- [ ] 2.4 RLS (Row Level Security) 정책 설정
- [ ] 2.5 Supabase Auth 설정
- [ ] 2.6 Database Functions 및 Triggers 설정 (알림 자동 생성 등)

### Phase 3: 공통 컴포넌트 및 레이아웃
- [ ] 3.1 Layout 컴포넌트 구현
  - Header (로고, 네비게이션, 프로필 메뉴)
  - Footer (GitHub 링크, 다크모드 토글)
- [ ] 3.2 shadcn/ui 컴포넌트 설치 및 커스터마이징
  - Button, Input, Card, Dialog, Dropdown, Toast, etc.
- [ ] 3.3 다크모드 구현 (next-themes)
- [ ] 3.4 로딩 컴포넌트 (Skeleton, Spinner)
- [ ] 3.5 에러 처리 컴포넌트

### Phase 4: 인증 시스템 구현
- [ ] 4.1 Supabase Auth 클라이언트 설정
- [ ] 4.2 회원가입 페이지
  - 아이디, 비밀번호, 닉네임, 이메일 입력
  - 이메일 인증 플로우
  - 프로필 사진 업로드 (옵션)
  - 프로필 사진 없을 시 랜덤 단색 컬러 생성
  - Zod 스키마 유효성 검증
- [ ] 4.3 로그인 페이지
  - 아이디, 비밀번호 로그인
  - 자동 로그인 기능 (remember me)
- [ ] 4.4 로그아웃 기능
- [ ] 4.5 인증 상태 관리 (Zustand)
- [ ] 4.6 Protected Routes 미들웨어

### Phase 5: 사용자 프로필 및 대시보드
- [ ] 5.1 대시보드 페이지 레이아웃
- [ ] 5.2 닉네임 수정 기능
- [ ] 5.3 비밀번호 변경 기능
- [ ] 5.4 프로필 사진 변경 기능
- [ ] 5.5 알림 설정 페이지
- [ ] 5.6 내가 쓴 글 목록 보기

### Phase 6: 카테고리 시스템
- [ ] 6.1 기본 카테고리 생성 (일상, 개발, 운동, 음악)
- [ ] 6.2 로그인 사용자 카테고리 추가 기능
- [ ] 6.3 카테고리별 필터링 UI
- [ ] 6.4 카테고리 관리 (CRUD)

### Phase 7: 게시글 시스템 (CRUD)
- [ ] 7.1 게시글 목록 페이지
  - 썸네일, 제목, 작성자, 시간 표시
  - 카테고리 필터
  - 무한 스크롤 또는 페이지네이션
- [ ] 7.2 게시글 작성 페이지
  - 제목, 내용 (BlockNote 에디터)
  - 카테고리 선택
  - 이미지 업로드 (최소 1장, 최대 제한 설정)
  - 썸네일 이미지 선택
  - 파일 용량 및 포맷 검증
- [ ] 7.3 게시글 상세 페이지
  - 작성자 닉네임, 프로필 사진, 작성 시간 (한국 시간)
  - BlockNote로 렌더링된 콘텐츠
  - 이미지 갤러리
  - UP 버튼 및 카운트
  - 댓글 섹션
- [ ] 7.4 게시글 수정 기능 (본인 글만)
- [ ] 7.5 게시글 삭제 기능 (본인 글만)
- [ ] 7.6 게시글 UP 기능 (중복 방지)

### Phase 8: 댓글 시스템
- [ ] 8.1 댓글 작성 (로그인 필수)
- [ ] 8.2 댓글 목록 표시
  - 작성자 닉네임, 프로필 사진, 작성 시간
  - 좋아요(하트) 버튼 및 카운트
- [ ] 8.3 댓글 수정/삭제 (본인 댓글만)
- [ ] 8.4 댓글 좋아요 기능 (중복 방지)
- [ ] 8.5 대댓글 기능 (선택 사항)

### Phase 9: 알림 시스템
- [ ] 9.1 알림 데이터 구조 설계
  - 댓글 알림
  - UP 알림
  - 좋아요 알림
- [ ] 9.2 알림 자동 생성 (Supabase Trigger)
- [ ] 9.3 알림 아이콘 및 배지 (읽지 않은 알림 카운트)
- [ ] 9.4 알림 목록 페이지
- [ ] 9.5 알림 읽음 처리
- [ ] 9.6 실시간 알림 업데이트 (Supabase Realtime)

### Phase 10: 이미지 업로드 및 관리
- [ ] 10.1 이미지 업로드 컴포넌트
  - Drag & Drop 지원
  - 미리보기
  - 파일 포맷 검증 (JPEG, PNG, WebP 등)
  - 파일 크기 제한 (예: 5MB)
- [ ] 10.2 프로필 이미지 처리
  - 이미지 리사이징/최적화
  - 랜덤 단색 배경 생성 로직
- [ ] 10.3 게시글 이미지 처리
  - 썸네일 선택 UI
  - 이미지 순서 관리

### Phase 11: UI/UX 개선
- [ ] 11.1 반응형 디자인 적용
- [ ] 11.2 로딩 상태 처리 (Skeleton, Spinner)
- [ ] 11.3 에러 상태 처리
- [ ] 11.4 빈 상태 UI (Empty State)
- [ ] 11.5 토스트 알림
- [ ] 11.6 애니메이션 및 트랜지션
- [ ] 11.7 접근성(A11y) 개선

### Phase 12: 배포 및 자동화
- [ ] 12.1 Vercel 배포 설정
- [ ] 12.2 환경변수 설정 (Vercel)
- [ ] 12.3 GitHub Actions 설정
  - Supabase Hibernate 방지 Cron Job
  - 주기적 헬스체크 (예: 매 10분)
- [ ] 12.4 도메인 연결 (선택 사항)
- [ ] 12.5 성능 최적화
  - 이미지 최적화 (Next.js Image)
  - 코드 스플리팅
  - 캐싱 전략

### Phase 13: 테스트 및 디버깅
- [ ] 13.1 기능 테스트
  - 회원가입/로그인 플로우
  - CRUD 동작
  - 권한 검증
  - 알림 동작
- [ ] 13.2 브라우저 호환성 테스트
- [ ] 13.3 반응형 테스트
- [ ] 13.4 성능 테스트
- [ ] 13.5 보안 검토 (RLS, 파일 업로드 등)

### Phase 14: 문서화 및 최종 점검
- [ ] 14.1 README.md 작성
- [ ] 14.2 Supabase 설정 가이드 문서
- [ ] 14.3 배포 가이드 문서
- [ ] 14.4 프로젝트 최종 검토
- [ ] 14.5 라이선스 및 기여 가이드

---

## Supabase 설정 상세 가이드

### 데이터베이스 스키마

#### 1. users 테이블 (auth.users 확장)
```sql
-- public.profiles 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT, -- 랜덤 컬러 저장
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. categories 테이블
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. posts 테이블
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- BlockNote content
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. post_images 테이블
```sql
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. comments 테이블
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. post_ups 테이블
```sql
CREATE TABLE post_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

#### 7. comment_likes 테이블
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

#### 8. notifications 테이블
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'up', 'like'
  content TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS (Row Level Security) 정책

각 테이블별 RLS 정책은 Phase 2에서 상세하게 작성할 예정입니다.

### Storage 버킷 설정

1. **profile-images** 버킷
   - Public 접근
   - 파일 크기 제한: 5MB
   - 허용 포맷: image/jpeg, image/png, image/webp

2. **post-images** 버킷
   - Public 접근
   - 파일 크기 제한: 10MB
   - 허용 포맷: image/jpeg, image/png, image/webp, image/gif

---

## 다음 단계

Phase 1부터 순차적으로 진행합니다. 각 단계를 완료할 때마다 체크리스트를 업데이트하겠습니다.
