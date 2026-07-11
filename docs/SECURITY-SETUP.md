# 보안 설정 가이드

이 앱은 **Google 로그인 + 이메일 허용목록**으로 보호됩니다. 코드 배포만으로는 잠기지 않으며,
아래 Firebase 콘솔 설정과 규칙 배포를 완료해야 실제로 보호가 적용됩니다.

## 1. Google 로그인 제공자 활성화

1. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 선택 → **Authentication** → **Sign-in method**
2. **Google** 제공자를 활성화하고 지원 이메일을 선택 후 저장

## 2. 승인된 도메인 등록

Authentication → **Settings** → **Authorized domains**에 다음을 추가:

- `localhost` (개발용, 기본 포함)
- Vercel 배포 도메인 (예: `your-site.vercel.app`, 프리뷰 배포용 `*.vercel.app` 포함)
- 커스텀 도메인이 있다면 함께 추가

미등록 도메인에서는 로그인 팝업이 `auth/unauthorized-domain` 오류로 실패합니다.

## 3. 멤버 이메일 허용목록 편집

두 파일의 플레이스홀더(`member1@example.com` 등)를 실제 스터디 멤버의 Google 계정
이메일(**소문자**)로 바꿉니다. **두 파일을 항상 함께 갱신하세요.**

- [database.rules.json](../database.rules.json) — `.read`와 `.write` 양쪽의 `||` 체인
  (RTDB 규칙 언어에는 배열/`in` 연산자가 없어 `||`로 나열하며, read/write에 동일 조건을 중복 기재해야 합니다)
- [storage.rules](../storage.rules) — `isMember()` 함수의 이메일 리스트

멤버 추가/제거 시마다 규칙을 다시 배포해야 합니다(아래 4번).

> **대안**: 멤버를 자주 바꾼다면 DB에 `/allowlist/{이메일의 .을 ,로 치환}: true` 노드를 두고
> 규칙을 `root.child('allowlist').child(auth.token.email.toLowerCase().replace('.', ',')).exists()`로
> 바꾸는 방법도 있습니다(RTDB 규칙의 `replace()`는 모든 `.`을 치환하므로 안전).
> 이 방식은 콘솔 데이터 편집만으로 멤버를 관리할 수 있어 규칙 재배포가 필요 없습니다.

## 4. 규칙 배포

**방법 A — 콘솔에서 붙여넣기 (간단):**

1. Realtime Database → **규칙** 탭 → `database.rules.json` 내용 붙여넣기 → 게시
2. Storage → **규칙** 탭 → `storage.rules` 내용 붙여넣기 → 게시

**방법 B — Firebase CLI (레포의 firebase.json 사용):**

```bash
npm install -g firebase-tools
firebase login
firebase use <프로젝트-ID>
firebase deploy --only database,storage
```

## 5. 동작 확인

1. 허용목록에 **없는** Google 계정으로 로그인 → "로그인 계정이 멤버 목록에 없습니다" 오류 화면이 떠야 정상
2. 허용목록에 **있는** 계정으로 로그인 → 대시보드 데이터가 로드되어야 정상
3. 시크릿 창에서 로그인 없이 접속 → 로그인 화면만 보이고 데이터 접근 불가

## 알아둘 점

- **Storage 다운로드 URL**: 앱은 `getDownloadURL()`이 만든 토큰 URL로 파일을 보여줍니다.
  이 URL은 Storage 규칙을 우회하므로, URL을 아는 사람은 해당 파일에 접근할 수 있습니다.
  민감한 파일 공유 시 유의하세요 (URL 유출 시 콘솔에서 해당 파일의 토큰을 재발급하면 기존 URL이 무효화됩니다).
- **클라이언트 Firebase 설정값**(`NEXT_PUBLIC_FIREBASE_*`)은 번들에 노출되는 것이 정상입니다.
  실제 보호는 위의 규칙이 담당합니다.
- **카카오톡/네이버 인앱 브라우저**에서는 Google OAuth가 차단됩니다. 로그인 화면에서
  외부 브라우저 안내가 자동 표시됩니다.
