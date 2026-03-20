import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HashKey ZKID",
  description: "Privacy-preserving identity on HashKeyChain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
