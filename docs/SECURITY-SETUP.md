# 보안 설정 가이드

이 앱은 **공개 열람 + 초대 기반 수정 권한**으로 운영됩니다. 회원가입 폼은 없으며,
누구나 로그인 없이 대시보드와 첨부 파일을 볼 수 있습니다. 수정은 관리자(admin)가
초대한 이메일로 Google 로그인한 사용자만 가능합니다.

## 접근 제어 모델

- `/admins/{이메일키}: true` — **관리자**. Firebase 콘솔에서 수동 등록(부트스트랩). 수정 + 멤버 관리.
- `/members/{이메일키}: { email, invitedBy, invitedAt }` — **편집 멤버**. admin이 대시보드 내 "멤버 관리"에서 추가/삭제(규칙 재배포 불필요).
- **이메일키** = 이메일을 소문자로 바꾼 뒤 `.`을 전부 `,`로 치환. 예: `hg.kim@flarelane.com` → `hg,kim@flarelane,com`.
- 읽기 자격 = 모두. 수정 자격 = `admin이거나 member`.
- 비로그인 사용자와 초대되지 않은 로그인 사용자는 수정 UI가 보이지 않는 **열람 전용** 상태입니다.

> `/admins`가 비어 있어도 공개 열람은 가능합니다. 다만 누구도 수정하거나 멤버를 초대할 수
> 없으므로, 운영 전 최초 admin은 반드시 등록하세요.

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

멤버 이메일을 규칙 파일에 넣을 필요가 없습니다(동적 수정 허용목록). 파일을 그대로 배포하세요.

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

## 5. 편집 멤버 초대 (일상 운영)

1. admin 계정으로 로그인 → 헤더의 **"멤버 관리"** 버튼 클릭
2. 초대할 이메일 입력 → **초대**. 그 이메일로 Google 로그인하면 수정 기능이 표시됩니다.
3. 목록에서 **제외**하면 수정 권한이 회수되고 열람 전용으로 전환됩니다.

이메일 발송 기능은 없으므로, 초대 대상에게 대시보드 URL은 외부(카카오톡 등)로 전달하세요.

## 6. 동작 확인

1. 시크릿 창에서 로그인 없이 접속 → 대시보드와 첨부 파일이 보이고, 추가·수정·삭제·업로드·복원 UI는 보이지 않아야 정상
2. `/admins`·`/members` 어디에도 없는 계정으로 로그인 → 헤더에 "열람 전용"이 표시되고 수정 UI는 보이지 않아야 정상
3. admin으로 로그인 → 헤더에 "편집 가능"과 "멤버 관리"가 표시
4. admin이 초대한 계정으로 로그인 → "편집 가능"과 수정 UI가 표시되고 "멤버 관리"는 보이지 않음

## 알아둘 점

- **Storage 규칙의 한계**: 파일 읽기는 요구사항에 따라 공개입니다. Storage 규칙은 Realtime
  Database(`/members`, `/admins`)를 참조할 수 없어(Firestore·custom claims만 가능), 파일 쓰기는
  "이메일이 검증된 로그인 사용자"까지 서버에서 확인하고 앱 UI는 초대 멤버에게만 노출합니다.
  Storage 쓰기까지 초대 목록으로 강제하려면 Cloud Functions로 member/admin custom claim을
  부여하고 `storage.rules`에 `request.auth.token.member == true` 조건을 추가해야 합니다.
- **Storage 다운로드 URL**: 앱은 `getDownloadURL()` 토큰 URL로 파일을 보여줍니다. 이 URL은
  Storage 규칙을 우회하므로 URL을 아는 사람은 접근 가능합니다(콘솔에서 토큰 재발급 시 무효화).
- **클라이언트 Firebase 설정값**(`NEXT_PUBLIC_FIREBASE_*`)은 번들에 노출되는 것이 정상입니다.
  실제 보호는 위 규칙과 초대 제어가 담당합니다.
- **카카오톡/네이버 인앱 브라우저**에서는 Google OAuth가 차단될 수 있습니다. 수정 로그인이
  실패하면 Chrome/Safari 같은 외부 브라우저에서 다시 시도하세요.
