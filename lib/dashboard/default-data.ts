import type { DashboardData } from "@/types/dashboard";

// 모든 섹션은 반드시 빈 값이어야 한다. RTDB는 빈 배열/객체 write를 키 삭제로
// 처리하고, 읽기 시 normalize()가 이 기본값으로 복원한다 — 여기에 시드 데이터를
// 넣으면 섹션의 마지막 항목을 지울 때마다 시드가 되살아난다.
export const DEFAULT_DATA: DashboardData = {
  portfolio: [],
  tradeJournal: [],
  returnsData: { labels: [], data: [] },
  financials: {},
  companyDocs: {},
  companyNotes: {},
  reports: {},
  reportComments: {},
  presentations: [],
  announcements: [],
  boardPosts: [],
  annualData: {},
  quarterlyData: {},
};
