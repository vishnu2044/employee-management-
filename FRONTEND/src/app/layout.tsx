import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/lib/query-provider";
import Header from "@/components/layout/Header";
import SplashScreen from "@/components/layout/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Employee Attendance & Working Hours",
  description: "A simple employee attendance and working hours system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <QueryProvider>
          <SplashScreen />
          <Header />
          <main className="flex-grow p-3 sm:p-4 lg:p-8 max-w-[1440px] mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-full">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
