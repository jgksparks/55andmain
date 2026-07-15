import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "55andMain — The Front Porch of the Community",
  description: "Discover events, experiences, services, and groups in your community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F6F2E8] text-[#233249]">
        {children}
      </body>
    </html>
  );
}
