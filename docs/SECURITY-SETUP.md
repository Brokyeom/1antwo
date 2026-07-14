# 보안 설정 가이드

이 앱은 **Google 로그인 + 초대 기반 접근 제어**로 보호됩니다. 회원가입 폼은 없고,
관리자(admin)가 초대한 이메일로 로그인한 사용자만 대시보드에 접근할 수 있습니다.
코드 배포만으로는 잠기지 않으며, 아래 콘솔 설정·규칙 배포·admin 부트스트랩을 완료해야
실제 보호가 적용됩니다.

## 접근 제어 모델

- `/admins/{이메일키}: true` — **관리자**. Firebase 콘솔에서 수동 등록(부트스트랩). 대시보드 접근 + 멤버 관리.
- `/members/{이메일키}: { email, invitedBy, invitedAt }` — **초대된 멤버**. admin이 대시보드 내 "멤버 관리"에서 추가/삭제(규칙 재배포 불필요).
- **이메일키** = 이메일을 소문자로 바꾼 뒤 `.`을 전부 `,`로 치환. 예: `hg.kim@flarelane.com` → `hg,kim@flarelane,com`.
- 대시보드 접근 자격 = `admin이거나 member`. 둘 다 아니면 로그인은 되지만 "초대되지 않은 계정" 화면이 표시됩니다.

> ⚠️ **부트스트랩 순서 주의**: `/admins`가 비어 있으면 아무도(관리자조차) 접근할 수 없습니다.
> 규칙 배포 후 **가장 먼저** 콘솔에서 최초 admin을 등록하세요(아래 3번).

## 1. Google 로그인 제공자 활성화

1. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트(`beensight`) → **Authentication** → **Sign-in method**
2. **Google** 제공자를 활성화하고 지원 이메일을 선택 후 저장

## 2. 승인된 도메인 등록

Authentication → **Settings** → **Authorized domains**에 다음을 추가:

- `localhost` (개발용, 기본 포함)
- Vercel 배포 도메인 (예: `your-site.vercel.app`, 프리뷰 배포용 `*.vercel.app` 포함)
- 커스텀 도메인이 있다면 함께 추가

미등록 도메인에서는 로그인 팝업이 `auth/unauthorized-domain` 오류로 실패합니다.

## 3. 규칙 배포

멤버 이메일을 규칙 파일에 넣을 필요가 없습니다(동적 허용목록). 파일을 그대로 배포하세요.

**방법 A — 콘솔에서 붙여넣기 (간단):**

1. Realtime Database → **규칙** 탭 → [database.rules.json](../database.rules.json) 내용 붙여넣기 → 게시
2. Storage → **규칙** 탭 → [storage.rules](../storage.rules) 내용 붙여넣기 → 게시

**방법 B — Firebase CLI (레포의 firebase.json 사용):**

```bash
npm install -g firebase-tools
firebase login
firebase use beensight
firebase deploy --only database,storage
```

## 4. 최초 admin 부트스트랩 (필수)

Realtime Database → **데이터** 탭에서 수동으로 추가:

```
admins
  └─ <이메일의 .을 ,로 치환>: true
```

예를 들어 관리자 이메일이 `hg.kim@flarelane.com`이면 키는 `hg,kim@flarelane,com`,
값은 boolean `true`. admin을 여러 명 두려면 같은 방식으로 여러 항목을 추가합니다.

> admin은 콘솔에서만 관리합니다(규칙상 앱에서 `/admins` 쓰기 불가). 멤버는 4번 이후
> 대시보드 안에서 관리합니다.

## 5. 멤버 초대 (일상 운영)

1. admin 계정으로 로그인 → 헤더의 **"멤버 관리"** 버튼 클릭
2. 초대할 이메일 입력 → **초대**. 그 이메일로 Google 로그인하면 즉시 접근 가능.
3. 목록에서 **제외**로 접근 권한 회수.

이메일 발송 기능은 없으므로, 초대 대상에게 대시보드 URL은 외부(카카오톡 등)로 전달하세요.

## 6. 동작 확인

1. `/admins`·`/members` 어디에도 없는 계정으로 로그인 → "초대되지 않은 계정입니다" 화면이 떠야 정상
2. admin으로 로그인 → 대시보드 로드 + 헤더에 "멤버 관리" 노출
3. admin이 초대한 계정으로 로그인 → 대시보드 접근 가능("멤버 관리"는 안 보임)
4. 시크릿 창에서 로그인 없이 접속 → 로그인 화면만 보이고 데이터 접근 불가

## 알아둘 점

- **Storage 규칙의 한계**: Storage 규칙은 Realtime Database(`/members`, `/admins`)를 참조할 수
  없어(Firestore·custom claims만 가능), 파일 접근은 "검증된 로그인 사용자"까지만 잠급니다.
  실질적인 접근 통제는 RTDB에 있습니다 — 초대되지 않은 사용자는 대시보드를 열 수 없어
  파일 경로/URL을 얻는 진입점이 없습니다. **완전한 Storage 잠금**이 필요하면 Cloud Functions로
  member/admin custom claim을 부여하고 `storage.rules`에 `request.auth.token.member == true`
  조건을 추가하세요.
- **Storage 다운로드 URL**: 앱은 `getDownloadURL()` 토큰 URL로 파일을 보여줍니다. 이 URL은
  Storage 규칙을 우회하므로 URL을 아는 사람은 접근 가능합니다(콘솔에서 토큰 재발급 시 무효화).
- **클라이언트 Firebase 설정값**(`NEXT_PUBLIC_FIREBASE_*`)은 번들에 노출되는 것이 정상입니다.
  실제 보호는 위 규칙과 초대 제어가 담당합니다.
- **카카오톡/네이버 인앱 브라우저**에서는 Google OAuth가 차단됩니다. 로그인 화면에서 외부 브라우저
  안내가 자동 표시됩니다.
