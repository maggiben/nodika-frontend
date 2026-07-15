import type { Metadata } from "next";
import { cookies } from "next/headers";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNavbar } from "@/components/app-navbar";
import { AppTheme } from "@/components/app-theme";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nordika",
  description: "Upload and manage Nordika project snapshots.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <InitColorSchemeScript defaultMode="system" />
        <AppTheme>
          <AppNavbar authenticated={authenticated} />
          {children}
        </AppTheme>
      </body>
    </html>
  );
}
