# 배포 가이드

## Vercel 배포

### 1. GitHub 저장소 준비

이미 GitHub에 프로젝트가 푸시되어 있어야 합니다.

### 2. Vercel 계정 생성 및 프로젝트 연결

1. [Vercel](https://vercel.com)에 가입하거나 로그인합니다
2. "New Project" 버튼을 클릭합니다
3. GitHub 저장소를 연결합니다
4. `cyber-garden` 저장소를 선택합니다

### 3. 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**환경 변수를 가져오는 방법:**
1. Supabase 프로젝트 대시보드로 이동
2. Settings → API로 이동
3. Project URL과 anon/public key를 복사

### 4. 배포 설정

- Framework Preset: **Next.js** (자동 감지됨)
- Build Command: `npm run build` (기본값)
- Output Directory: `.next` (기본값)
- Install Command: `npm install` (기본값)

### 5. 배포

"Deploy" 버튼을 클릭하여 배포를 시작합니다.

배포가 완료되면 Vercel이 제공하는 URL로 접속할 수 있습니다.

## Supabase 설정 확인

배포 전에 Supabase 설정이 완료되어 있는지 확인하세요:

### 1. 데이터베이스 마이그레이션

`supabase/migrations` 폴더의 모든 SQL 파일이 실행되었는지 확인:

1. Supabase Dashboard → SQL Editor로 이동
2. 각 마이그레이션 파일의 내용을 복사하여 실행
3. 순서대로 실행:
   - `20250101000000_initial_schema.sql`
   - `20250101000001_rls_policies.sql`
   - `20250101000002_functions_triggers.sql`
   - `20250101000003_storage_buckets.sql`
   - `20250101000004_seed_data.sql`

### 2. Storage 버킷 설정 확인

Storage → Buckets에서 다음 버킷이 생성되어 있는지 확인:

- `profile-images` (public)
- `post-images` (public)

각 버킷의 정책이 올바르게 설정되어 있는지 확인하세요.

### 3. RLS (Row Level Security) 확인

Database → Tables에서 각 테이블의 RLS가 활성화되어 있고,
정책이 올바르게 설정되어 있는지 확인하세요.

## GitHub Actions 설정 (Supabase Hibernate 방지)

### 1. GitHub Secrets 설정

GitHub 저장소 Settings → Secrets and variables → Actions로 이동하여 다음 시크릿을 추가:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

### 2. Workflow 확인

`.github/workflows/keep-alive.yml` 파일이 저장소에 있는지 확인합니다.

이 워크플로우는 6시간마다 자동으로 Supabase API를 호출하여
Hibernate 상태로 전환되는 것을 방지합니다.

### 3. 수동 실행

필요시 GitHub Actions 탭에서 수동으로 워크플로우를 실행할 수 있습니다.

## 도메인 연결 (선택사항)

### 1. Vercel에서 도메인 추가

1. Vercel 프로젝트 Settings → Domains로 이동
2. 원하는 도메인을 입력
3. DNS 설정 안내를 따릅니다

### 2. DNS 설정

도메인 제공업체에서 다음 레코드를 추가합니다:

- Type: `A` 또는 `CNAME`
- Name: `@` 또는 `www`
- Value: Vercel이 제공하는 주소

## 성능 최적화

### 1. 이미지 최적화

Next.js의 Image 컴포넌트가 자동으로 이미지를 최적화합니다.
추가 설정이 필요하다면 `next.config.js`에서 설정할 수 있습니다.

### 2. 캐싱

Vercel은 자동으로 정적 자산을 캐싱합니다.
API 라우트나 동적 페이지의 캐싱이 필요하다면
`revalidate` 옵션을 사용하세요.

### 3. Analytics

Vercel Analytics를 활성화하여 성능을 모니터링할 수 있습니다:

1. Vercel 프로젝트 Settings → Analytics
2. "Enable Analytics" 클릭

## 문제 해결

### 배포 실패

1. Vercel 빌드 로그를 확인합니다
2. 환경 변수가 올바르게 설정되었는지 확인합니다
3. 로컬에서 `npm run build`가 성공하는지 확인합니다

### Supabase 연결 오류

1. 환경 변수의 URL과 Key가 정확한지 확인합니다
2. Supabase 프로젝트가 활성 상태인지 확인합니다
3. RLS 정책이 올바르게 설정되었는지 확인합니다

### 이미지 업로드 실패

1. Storage 버킷이 생성되어 있는지 확인합니다
2. Storage 정책이 올바르게 설정되었는지 확인합니다
3. 파일 크기 제한을 확인합니다

## 모니터링

### Vercel Monitoring

- Vercel Dashboard에서 배포 상태를 모니터링할 수 있습니다
- 실시간 로그를 확인할 수 있습니다
- Analytics로 트래픽과 성능을 분석할 수 있습니다

### Supabase Monitoring

- Supabase Dashboard → Reports에서 사용량을 확인할 수 있습니다
- Logs에서 API 호출 로그를 확인할 수 있습니다

## 업데이트 배포

코드를 수정한 후:

1. GitHub에 푸시합니다
2. Vercel이 자동으로 새 배포를 시작합니다
3. 배포가 완료되면 자동으로 프로덕션에 반영됩니다

프로덕션 배포 전에 프리뷰 배포를 확인하세요:
- Pull Request를 생성하면 Vercel이 자동으로 프리뷰 배포를 생성합니다
- 프리뷰 URL에서 변경사항을 확인한 후 머지하세요
