import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cole Studio — Cinematography, Photography & Studio Rental",
  description:
    "Award-winning cinematography, commercial photography, and fully equipped studio space in Los Angeles. Book your session today.",
  keywords: [
    "cinematography",
    "photography",
    "studio rental",
    "Los Angeles",
    "film production",
    "video production",
    "Cole Studio",
  ],
  openGraph: {
    title: "Cole Studio — Frame The Moment",
    description:
      "Award-winning cinematography, commercial photography, and studio rental in Silver Lake, Los Angeles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
