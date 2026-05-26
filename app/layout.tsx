import './globals.css';

export const metadata = {
  title: '나의 독서DB & 도안 저장소',
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
