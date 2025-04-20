import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Movie Theater",
  description: "Movie Theater",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-8 items-center">
              <nav className="sticky top-0 z-50 w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background/80 backdrop-blur">
                <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center font-semibold">
                    <Link href={"/"}>Movie Theater</Link>
                    <nav className="flex gap-3 ml-6">
                      <Link href="/movies" className="hover:underline">Movies</Link>
                      <Link href="/theaters" className="hover:underline">Theaters</Link>
                      <Link href="/showings" className="hover:underline">Showings</Link>
                      <Link href="/dashboard" className="hover:underline font-semibold">Dashboard</Link>
                    </nav>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
              <div className="flex flex-col gap-20 max-w-6xl p-5">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
                <p>
                &copy; 2025 Movie Theater
                </p>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
