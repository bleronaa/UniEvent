import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import './globals copy.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniEvent",
  description: "Your campus event management platform",
  icons:{
    icon: '/assets/images/logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}