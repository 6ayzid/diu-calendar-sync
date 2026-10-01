import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const sansFont = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://diucal.vercel.app'),
  title: "DIU Routine Calendar Sync | Daffodil International University",
  description:
    "Live DIU class routine and routine diu sync platform for Daffodil International University. Use our real-time DIU routine scrapper to search class schedules, compare timetables, find empty classrooms, and sync to Google or Apple Calendar.",
  keywords: [
    "DIU routine scrapper",
    "routine diu",
    "DIU class routine",
    "diu routine",
    "routine scrapper diu",
    "diu routine scraper",
    "daffodil class routine",
    "diu cse routine",
    "diu timetable",
    "diu faculty initial",
    "DIU",
    "Daffodil International University",
    "Empty Room Finder",
    "DIU Calendar Sync",
  ],
  authors: [{ name: "@6ayzid", url: "https://github.com/6ayzid" }],
  creator: "@6ayzid",
  publisher: "DIU Calendar Sync",
  applicationName: "DIU Calendar Sync",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://diucal.vercel.app",
    siteName: "DIU Calendar Sync",
    title: "DIU Routine Calendar Sync | Daffodil International University",
    description:
      "Live DIU class routine and routine diu sync platform for Daffodil International University. Use our real-time DIU routine scrapper to search class schedules, compare timetables, find empty classrooms, and sync to Google or Apple Calendar.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "DIU Routine Calendar Sync | Daffodil International University",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DIU Routine Calendar Sync | Daffodil International University",
    description:
      "Live DIU class routine and routine diu sync platform for Daffodil International University. Use our real-time DIU routine scrapper to search class schedules, compare timetables, find empty classrooms, and sync to Google or Apple Calendar.",
    images: ["/icon.svg"],
    creator: "@6ayzid",
  },
  verification: {
    google: "google49d1d0d24a1985a3.html",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('diu-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved === 'dark' || ((!saved || saved === 'system') && systemDark);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sansFont.variable} ${monoFont.variable} min-h-full antialiased font-sans bg-slate-50 dark:bg-[#080d1a]`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} suppressHydrationWarning />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#080d1a] dark:text-slate-100 transition-colors duration-150">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
