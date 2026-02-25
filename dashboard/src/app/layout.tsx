import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanbania Dashboard",
  description: "Visual dashboard for the Kanbania kanban system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <WebSocketProvider>
            <AppShell>{children}</AppShell>
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
