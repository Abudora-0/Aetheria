import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/system/theme-provider";
import { MotionPrefsProvider } from "@/components/system/motion-prefs";
import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const sans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_NAME} - Automated Social Scheduling and Analytics`,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  keywords: [
    "social media scheduling",
    "content calendar",
    "analytics",
    "creator tools",
    "auto publishing",
  ],
  authors: [{ name: "Aetheria" }],
  openGraph: {
    title: `${APP_NAME} - Automated Social Scheduling and Analytics`,
    description: APP_TAGLINE,
    type: "website",
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full">
        <ThemeProvider>
          <MotionPrefsProvider>
            <ToastProvider>{children}</ToastProvider>
          </MotionPrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
