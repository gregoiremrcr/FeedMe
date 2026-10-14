import type { Metadata } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "FeedMe - Bons plans food campus",
  description: "Trouve où manger près du campus selon ton budget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${garamond.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-body">
        <AuthProvider>
          <Header />
          <main className="w-full pt-20">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}