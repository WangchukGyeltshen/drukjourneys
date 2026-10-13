import type { Metadata } from "next";
import { Bricolage_Grotesque, Noto_Serif_Tibetan, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const body = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  display: "swap",
});

// Dzongkha is written in the Tibetan script, which the two Latin fonts above
// do not contain. This font is only a fallback: the browser downloads it
// when a page actually contains Tibetan-script characters, so visitors who
// never see Dzongkha text never pay for it. Only the regular weight is
// loaded: the variable version is over 700 kB because Tibetan glyphs are
// complex, and bold is synthesised by the browser where needed.
const dzongkha = Noto_Serif_Tibetan({
  variable: "--font-dzongkha",
  subsets: ["tibetan"],
  weight: "400",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "DrukJourneys: tours in Bhutan",
    template: "%s | DrukJourneys",
  },
  description:
    "Browse guided tour packages across Bhutan, with a licensed local guide and vehicle on every trip.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${dzongkha.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
