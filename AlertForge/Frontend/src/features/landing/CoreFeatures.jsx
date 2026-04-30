import { Zap, Users, Timeline, Activity, Globe, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FeatureCard } from "@/components/blocks/grid-feature-cards";

const features = [
  {
    title: "Real-Time Incident Detection",
    icon: Zap,
    description:
      "Automatically detect outages via monitoring tools and trigger incidents instantly.",
  },
  {
    title: "War Room Collaboration",
    icon: Users,
    description:
      "Bring your team together in a live command center to coordinate and resolve incidents faster.",
  },
  {
    title: "Live Timeline & Updates",
    icon: Timeline,
    description:
      "Track every action with a structured timeline including system logs and team updates.",
  },
  {
    title: "Smart Status Management",
    icon: Activity,
    description:
      "Move incidents through stages like Investigating, Identified, and Resolved with ease.",
  },
  {
    title: "Public Status Page",
    icon: Globe,
    description:
      "Keep users informed with a clean, real-time status page for all services and incidents.",
  },
  {
    title: "AI-Powered Insights",
    icon: Sparkles,
    description:
      "Generate summaries and probable root causes automatically to speed up resolution.",
  },
];

export default function CoreFeatures() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-[geist-regular] text-white tracking-wide text-balance md:text-4xl lg:text-5xl xl:font-extrabold">
            Power. Speed. Control.
          </h2>
          <p className="text-muted-foreground font-[geist-light] mt-4 text-sm tracking-wide text-balance md:text-base">
            Everything you need to build fast, secure, scalable apps.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 md:grid-cols-3 text-white"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}

function AnimatedContainer({ className, delay = 0.1, children }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
