import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/navbar";
import React from "react";
import localFont from "next/font/local";
import AnaglyphShadow from "@/app/anaglyph_shadow";
import { AuthProvider } from "@/components/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/query-core";
import Providers from "@/app/Providers";

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
const maison_galliard = localFont({
  src: "../../public/fonts/maison-galliard-serif.otf",
  variable: "--font-maison-galliard",
  weight: "100",
});
const jetbrains_mono = localFont({
  src: "../../public/fonts/JetBrainsMono-Medium.woff2",
  variable: "--font-maison-galliard",
  weight: "500",
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
    <html
      lang="en"
      className={`${maison_galliard.variable}  ${evangelion.variable} ${evaMatisse.variable}`}
    >
      <body>
        <AuthProvider>
          <AnaglyphShadow>
            <Providers>
              <Navbar />
              {children}
            </Providers>
          </AnaglyphShadow>
        </AuthProvider>
      </body>
    </html>
  );
}
