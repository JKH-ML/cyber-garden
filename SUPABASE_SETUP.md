# Supabase 설정 가이드

## 1. 이메일 인증 비활성화 (개발 환경)

개발 환경에서는 이메일 인증을 자동으로 확인되도록 설정하는 것이 편리합니다.

### 방법 1: Dashboard에서 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication → Settings → Email** 탭으로 이동
4. **"Confirm email"** 옵션을 **비활성화** (체크 해제)
5. **Save** 클릭

### 방법 2: SQL로 설정

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- 이메일 확인 자동화 (개발용)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 향후 가입하는 사용자도 자동 확인되도록 트리거 생성
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거가 이미 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;

-- 트리거 생성
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();
```

## 2. 데이터베이스 마이그레이션 실행

`supabase/migrations` 폴더의 SQL 파일을 **순서대로** 실행하세요:

### 2.1 Initial Schema
```sql
-- supabase/migrations/20250101000000_initial_schema.sql
-- 모든 테이블과 인덱스 생성
```

### 2.2 RLS Policies
```sql
-- supabase/migrations/20250101000001_rls_policies.sql
-- Row Level Security 정책 설정
```

### 2.3 Functions & Triggers
```sql
-- supabase/migrations/20250101000002_functions_triggers.sql
-- 알림 생성, 프로필 자동 생성 등
```

### 2.4 Storage Buckets
```sql
-- supabase/migrations/20250101000003_storage_buckets.sql
-- profile-images, post-images 버킷 생성
```

### 2.5 Seed Data
```sql
-- supabase/migrations/20250101000004_seed_data.sql
-- 기본 카테고리 데이터
```

## 3. Storage 설정 확인

### 3.1 버킷 생성 확인
1. **Storage → Buckets**로 이동
2. 다음 버킷이 생성되어 있는지 확인:
   - `profile-images` (public)
   - `post-images` (public)

### 3.2 버킷 정책 확인
각 버킷의 Policies에서 다음 정책이 있는지 확인:

#### profile-images
- **이름**: Allow authenticated users to upload their own avatar
- **허용**: INSERT
- **조건**: `auth.uid() = (storage.foldername(name))[1]::uuid`

- **이름**: Anyone can view profile images
- **허용**: SELECT
- **조건**: `true`

#### post-images
- **이름**: Allow authenticated users to upload post images
- **허용**: INSERT
- **조건**: `auth.uid() = (storage.foldername(name))[1]::uuid`

- **이름**: Anyone can view post images
- **허용**: SELECT
- **조건**: `true`

## 4. RLS (Row Level Security) 확인

**Database → Tables**에서 각 테이블의 RLS가 활성화되어 있는지 확인:

- ✅ profiles
- ✅ categories
- ✅ posts
- ✅ post_images
- ✅ comments
- ✅ post_ups
- ✅ comment_likes
- ✅ notifications

## 5. 트리거 확인

**Database → Functions**에서 다음 함수들이 있는지 확인:

- `handle_new_user()` - 회원가입 시 프로필 자동 생성
- `create_comment_notification()` - 댓글 알림
- `create_post_up_notification()` - UP 알림
- `create_comment_like_notification()` - 댓글 좋아요 알림

## 6. 환경 변수 설정

### 로컬 개발 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel 배포
프로젝트 Settings → Environment Variables에서 설정

### GitHub Actions
Repository Settings → Secrets and variables → Actions에서 설정

## 7. 테스트

모든 설정이 완료되면 다음을 테스트하세요:

1. ✅ 회원가입 (이메일 자동 확인)
2. ✅ 로그인
3. ✅ 프로필 이미지 업로드
4. ✅ 게시글 작성
5. ✅ 댓글 작성
6. ✅ 알림 수신

## 문제 해결

### 회원가입이 안 되는 경우
1. 브라우저 콘솔(F12)에서 에러 확인
2. Supabase Dashboard → Authentication → Users에서 사용자가 생성되었는지 확인
3. Database → Table Editor → profiles에서 프로필이 생성되었는지 확인

### 이미지 업로드가 안 되는 경우
1. Storage 버킷이 생성되어 있는지 확인
2. Storage 정책이 올바르게 설정되어 있는지 확인
3. 이미지 파일 크기 확인 (제한: profile-images 5MB, post-images 10MB)

### 알림이 오지 않는 경우
1. 트리거가 생성되어 있는지 확인
2. notifications 테이블의 RLS 정책 확인
3. Supabase Realtime이 활성화되어 있는지 확인

## 프로덕션 배포 시 주의사항

### 이메일 인증 활성화
프로덕션에서는 보안을 위해 이메일 인증을 활성화하는 것을 권장합니다:

1. **Authentication → Settings → Email**
2. **"Confirm email"** 체크
3. 이메일 템플릿 커스터마이징
4. SMTP 설정 (선택사항)

### Rate Limiting
Supabase는 기본적으로 Rate Limiting을 제공하지만, 추가 보호를 위해:
- API Rate Limiting 확인
- Auth Rate Limiting 설정

### 데이터베이스 백업
- Supabase는 자동 백업을 제공하지만, 중요한 데이터는 추가 백업 권장
- 정기적인 데이터 내보내기 스케줄 설정
