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
  title: "Sapthagiri Studio — Photography, Cinematography & Studio Rental",
  description:
    "Professional photography, cinematic videography, and fully equipped studio space in Harohalli since 1996. Book your session today.",
  keywords: [
    "Sapthagiri Studio",
    "photography Harohalli",
    "cinematography",
    "studio rental",
    "wedding photography",
    "Murali photographer",
    "Harohalli studio",
    "video production",
  ],
  openGraph: {
    title: "Sapthagiri Studio — Capture Every Emotion, Forever",
    description:
      "Professional photography, cinematic videography, and studio rental in Harohalli since 1996.",
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
