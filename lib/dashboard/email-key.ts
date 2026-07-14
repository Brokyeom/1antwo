// RTDB 키에는 '.'을 쓸 수 없으므로 이메일을 키로 쓸 때 '.'을 ','로 전부 치환한다.
// database.rules.json의 `auth.token.email.toLowerCase().replace('.', ',')`와 반드시 일치해야
// 하며(RTDB 규칙의 replace는 전역 치환), 그래서 JS는 replaceAll을 쓴다.
export function emailToKey(email: string) {
  return email.trim().toLowerCase().replaceAll(".", ",");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim());
}
