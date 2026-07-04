import Nav from "@/components/sections/nav";
import Hero from "@/components/sections/hero";
import Stats from "@/components/sections/stats";
import Features from "@/components/sections/features";
import HowItWorks from "@/components/sections/how-it-works";
import Showcase from "@/components/sections/showcase";
import Testimonials from "@/components/sections/testimonials";
import LogoCloud from "@/components/sections/logo-cloud";
import Pricing from "@/components/sections/pricing";
import Faq from "@/components/sections/faq";
import Cta from "@/components/sections/cta";
import Footer from "@/components/sections/footer";
import { CursorGlow } from "@/components/fx/cursor-glow";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Showcase />
        <Testimonials />
        <LogoCloud />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
