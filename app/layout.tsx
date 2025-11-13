import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import bgImg from "@/public/halo.png";
import PlausibleProvider from "next-plausible";

let title = "Dobby Coder – AI Code Generator";
let description = "Generate your next app with Fireworks AI";
let url = "https://dobbycoder.io/";
let ogimage = "https://dobbycoder.io/og-image.png";
let sitename = "dobbycoder.io";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="dobbycoder.io" />
      </head>
      <body className="bg-brand antialiased">
        <div className="absolute inset-x-0 flex justify-center">
          <Image
            src={bgImg}
            alt=""
            className="w-full max-w-[1200px] mix-blend-screen"
            priority
          />
        </div>
        <div className="isolate">{children}</div>
      </body>
    </html>
  );
}