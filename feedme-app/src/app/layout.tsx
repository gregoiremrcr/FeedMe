import type { Metadata } from "next"; 
import {EB_Garamond} from "next/font/google";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./globals.css";

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond" });
const manrope = EB_Garamond({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "FeedMe - Bon plan food campus",
  description: "Trouve où manger près de ton campus selon ton budget",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${garamond.variable} ${manrope.variable}`}>
      <body className="bg-white text-black dark:bg-black dark:text-white">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}