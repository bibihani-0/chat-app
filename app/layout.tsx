import "./globals.css";

export const metadata = {
  title: "Chat & Games App",
  description: "Real-Time Social Chat & Multiplayer Games",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
