import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Komunitas Belajar UTBK | Pejuang PTN",
  description: "Platform komunitas dan belajar mandiri untuk siswa SMA pejuang UTBK. Forum diskusi, modul video, dan simulasi kuis yang dioptimalkan untuk HP.",
  keywords: ["UTBK", "SNBT", "belajar", "PTN", "kuis", "forum", "simulasi ujian"],
  authors: [{ name: "Pejuang PTN" }],
  openGraph: {
    title: "Komunitas Belajar UTBK",
    description: "Platform belajar mandiri untuk pejuang PTN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${montserrat.variable} font-sans antialiased bg-[#F9FAFB] text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
