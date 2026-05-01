import GradientBlinds from "@/components/ui/GradientBlinds";
import { Navbar } from "@/components/layout/Navbar";

function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden ">
        {/* GradientBlinds background */}
        <div className="absolute inset-0 w-full h-full">
          <GradientBlinds
            gradientColors={["#3430a2", "#5227FF"]}
            angle={25}
            noise={0.3}
            blindCount={12}
            blindMinWidth={50}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
          />
        </div>

        {/* Dark overlay to keep bg subtle */}
        <div className="absolute inset-0 bg-[#0a0a0a]/60 pointer-events-none" />

        {/* Radial vignette edges */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_40%,#0a0a0a_100%)]" />
        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 md:px-10 max-w-4xl mx-auto pt-24 pb-20">
          {/* Eyebrow badge */}
          <div className="mb-8 inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-zinc-400 text-xs font-medium tracking-wide uppercase">
              Incident Response · Reimagined
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-white font-[geist-regular] tracking-tight leading-none mb-6
                         text-[clamp(2.8rem,8vw,6rem)]"
          >
            <span className="block">Move fast when</span>
            <span className="block bg-clip-text">
              you break things.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-zinc-400 font-normal leading-relaxed max-w-2xl
                        text-[clamp(0.90rem,2.2vw,1.2rem)] font-[geist-regular]"
          >
            <span className="block ">
              The all-in-one AI platform for on-call, incident response,
            </span>
            <span className="block">
              and status pages—built for fast-moving teams.
            </span>
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <a
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-all duration-200 shadow-2xl shadow-white/10"
            >
              Get started free
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/6 border border-white/1 text-zinc-300 font-medium text-sm hover:bg-white/1 hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              See how it works →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
