import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/navbar";
import React from "react";
import localFont from "next/font/local";

//MUST ADD FRONTS HERE
//TO MAKE THEM WORK PROPERLY ACROSS ALL BROWSERS
const evangelion = localFont({
  src: "../../public/fonts/evangelion-regular.otf",
  variable: "--font-evangelion",
  weight: "100",
});

const evaMatisse = localFont({
  src: "../../public/fonts/EVA-Matisse_Classic.ttf",
  variable: "--font-eva-matisse",
  weight: "100",
});

export const metadata: Metadata = {
  title: "Jack Angione Photography",
  description: "Jack Angione Photography",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${evangelion.variable} ${evaMatisse.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
