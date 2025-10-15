# Cyber Garden

일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4
- **Icons**: Lucide Icons
- **Editor**: BlockNote
- **State Management**: Zustand
- **Validation**: Zod
- **Backend/DB**: Supabase (Auth, Database, Storage, Realtime)
- **Deployment**: Vercel

## 주요 기능

### 인증 시스템
- 이메일 기반 회원가입 및 로그인
- 프로필 사진 업로드 (랜덤 컬러 아바타 지원)
- 프로필 편집 (닉네임, 아바타)
- 비밀번호 변경

### 게시글 시스템
- BlockNote 리치 텍스트 에디터
- 다중 이미지 업로드 (썸네일 선택)
- 카테고리별 게시글 필터링
- 게시글 CRUD (작성, 읽기, 수정, 삭제)
- UP(좋아요) 기능
- 실시간 댓글 시스템
- 댓글 좋아요 기능

### 알림 시스템
- 실시간 알림 (Supabase Realtime)
- 댓글, UP, 좋아요 알림
- 읽음/안읽음 상태 관리

### UI/UX
- 다크모드 지원
- 반응형 디자인
- 부드러운 애니메이션
- 로딩 스켈레톤
- 에러 바운더리

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/migrations` 폴더의 SQL 마이그레이션 파일들을 순서대로 실행:
   - `20250101000000_initial_schema.sql` - 테이블 스키마
   - `20250101000001_rls_policies.sql` - Row Level Security 정책
   - `20250101000002_functions_triggers.sql` - 함수 및 트리거
   - `20250101000003_storage_buckets.sql` - Storage 버킷
   - `20250101000004_seed_data.sql` - 초기 데이터 (카테고리)

자세한 설정 방법은 `supabase/README.md`를 참고하세요.

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 프로젝트 구조

```
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   ├── dashboard/           # 대시보드
│   ├── posts/               # 게시글 페이지
│   └── ...
├── components/              # React 컴포넌트
│   ├── common/             # 공통 컴포넌트
│   ├── editor/             # BlockNote 에디터
│   ├── layout/             # 레이아웃 컴포넌트
│   ├── posts/              # 게시글 컴포넌트
│   └── ui/                 # shadcn/ui 컴포넌트
├── hooks/                   # Custom React Hooks
├── lib/                     # 유틸리티 및 설정
│   ├── supabase/           # Supabase 클라이언트
│   └── validations/        # Zod 스키마
├── stores/                  # Zustand 상태 관리
├── supabase/               # Supabase 마이그레이션
└── types/                   # TypeScript 타입 정의
```

## 배포

### Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정 (Supabase URL, Anon Key)
3. 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Supabase Hibernate 방지

Supabase 무료 플랜은 1주일 이상 사용하지 않으면 Hibernate 상태가 됩니다.
이를 방지하기 위해 GitHub Actions를 사용하여 주기적으로 API를 호출할 수 있습니다.

자세한 내용은 `.github/workflows/` 폴더를 참고하세요.

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!
