import {
  Fira_Code as FontMono,
  Inter as FontSans,
  Noto_Sans_Arabic as FontArabic,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontArabic = FontArabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
