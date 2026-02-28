import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingThemeToggle } from "@/components/FloatingThemeToggle";
import { CursorGlow } from "@/components/CursorGlow";
import { ClickSound } from "@/components/ClickSound";

// DM Sans — humanist grotesque, excellent clarity, pairs well with Instrument Serif
// Injected under the same --font-sora variable so every existing reference just works
const dmSans = DM_Sans({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Instrument Serif — editorial display face, used only for large headings
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "NoCarry — Fair grading for group projects",
  description: "Track contributions, eliminate freeloaders, and grade group projects fairly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('nc-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${instrumentSerif.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <FloatingThemeToggle />
          <CursorGlow />
          <ClickSound />
        </ThemeProvider>
      </body>
    </html>
  );
}
