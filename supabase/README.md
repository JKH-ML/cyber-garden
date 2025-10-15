# Supabase 설정 가이드

## 데이터베이스 마이그레이션 실행

Supabase 대시보드에서 SQL 에디터를 열고 아래 순서대로 마이그레이션 파일을 실행하세요:

1. **20250101000000_initial_schema.sql** - 데이터베이스 스키마 생성
2. **20250101000001_rls_policies.sql** - Row Level Security 정책 설정
3. **20250101000002_functions_triggers.sql** - 함수 및 트리거 생성
4. **20250101000003_storage_buckets.sql** - Storage 버킷 및 정책 설정
5. **20250101000004_seed_data.sql** - 기본 카테고리 데이터 생성

## SQL 에디터 접근 방법

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 각 마이그레이션 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

## 데이터베이스 스키마 개요

### Tables

- **profiles** - 사용자 프로필 (auth.users 확장)
- **categories** - 게시글 카테고리
- **posts** - 게시글
- **post_images** - 게시글 이미지
- **comments** - 댓글
- **post_ups** - 게시글 UP (좋아요)
- **comment_likes** - 댓글 좋아요
- **notifications** - 알림

### Storage Buckets

- **profile-images** - 프로필 사진 (최대 5MB)
- **post-images** - 게시글 이미지 (최대 10MB)

### Key Features

1. **자동 프로필 생성**: 회원가입 시 자동으로 프로필 생성 및 랜덤 아바타 색상 할당
2. **자동 알림 생성**: 댓글, UP, 좋아요 발생 시 자동으로 알림 생성
3. **RLS 보안**: 모든 테이블에 Row Level Security 적용
4. **최적화된 인덱스**: 자주 조회되는 컬럼에 인덱스 생성

## Storage 설정

Storage 버킷은 자동으로 생성되지만, Supabase 대시보드에서 다음 설정을 확인하세요:

### profile-images 버킷
- Public 접근: ✅
- 파일 크기 제한: 5MB
- 허용 포맷: image/jpeg, image/png, image/webp

### post-images 버킷
- Public 접근: ✅
- 파일 크기 제한: 10MB
- 허용 포맷: image/jpeg, image/png, image/webp, image/gif

## Authentication 설정

1. Supabase Dashboard → Authentication → Providers
2. Email 로그인 활성화
3. 이메일 인증 설정 (선택사항)

## 환경 변수

`.env.local` 파일에 Supabase 정보 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

프로젝트 URL과 Anon Key는 Supabase Dashboard → Settings → API에서 확인할 수 있습니다.

## 데이터베이스 타입 생성 (선택사항)

Supabase CLI를 사용하여 TypeScript 타입을 자동 생성할 수 있습니다:

```bash
npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

## 문제 해결

### 마이그레이션 실행 오류
- 순서대로 실행했는지 확인
- 이전 마이그레이션이 성공적으로 완료되었는지 확인
- 에러 메시지를 확인하여 문제 해결

### Storage 업로드 오류
- RLS 정책이 올바르게 설정되었는지 확인
- 파일 크기 제한 확인
- 버킷이 public으로 설정되었는지 확인
