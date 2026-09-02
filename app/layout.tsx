import type { Metadata } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet-context";
import { Navbar } from "@/components/Navbar";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Trike",
  description: "Protección de transferencias para adultos mayores en Stellar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${lexend.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen font-body">
        <AuthSessionProvider>
          <WalletProvider>
            <Navbar />
            <main>{children}</main>
          </WalletProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
