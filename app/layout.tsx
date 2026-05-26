import './globals.css';

export const metadata = {
  title: '고래고래 도안 저장소', // 여기서 탭 제목이 바뀝니다!
  description: 'AI 기반 뜨개질 도안 자동 정리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
