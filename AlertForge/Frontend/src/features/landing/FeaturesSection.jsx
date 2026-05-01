import CardSwap, { Card } from "@/components/CardSwap";
import { BadgeCheck, Brain, Rocket } from "lucide-react";

function FeaturesSection() {
  return (
    <section className="w-full h-fit lg:h-[80vh] bg-[#0a0a0a] py-24 px-6 md:px-10 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-row items-center gap-6">
        {/* LEFT — Text (shows below on mobile/tablet) */}
        <div className="w-full md:w-[45%] flex flex-col">
          <p className="text-zinc-200 text-md md:text-2xl font-[geist-regular] leading-snug tracking-tight">
            It's not about saving time.
          </p>
          <p className="text-zinc-500 text-md md:text-2xl font-[geist-regular] leading-snug tracking-tight max-w-[250px]">
            It's about feeling like you're never wasting it.
          </p>
        </div>

        {/* RIGHT — CardSwap (shows on top on mobile/tablet) */}
        <div className="w-full md:w-[70%] flex justify-center md:block">
          <div
            className="w-full md:scale-70 lg:scale-120 lg:origin-right"
            style={{ height: "clamp(10px, 30vw, 550px)", position: "relative" }}
          >
            <CardSwap
              cardDistance={55}
              verticalDistance={65}
              delay={5000}
              pauseOnHover={false}
            >
              <Card>
                <h3 className="text-white text-xl md:text-2xl font-[geist-light] leading-snug tracking-tight p-4">
                  <BadgeCheck className="shrink-0 inline-block mr-2" />
                  <span>Reliable</span>
                </h3>
                <p>Your content here</p>
              </Card>
              <Card>
                <h3 className="text-white text-xl md:text-2xl font-[geist-light] leading-snug tracking-tight p-4">
                  <Rocket className="shrink-0 inline-block mr-2" />
                  <span>Quick</span>
                </h3>
                <p>Your content here</p>
              </Card>
              <Card>
                <h3 className="text-white text-xl md:text-2xl font-[geist-light] leading-snug tracking-tight p-4">
                  <Brain className="shrink-0 inline-block mr-2" />
                  <span>AI Powered</span>
                </h3>
                <p>Your content here</p>
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
