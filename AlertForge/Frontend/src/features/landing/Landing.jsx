import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import CoreFeatures from "./CoreFeatures";
import CodeShowcase from "./CodeShowcase";
import Footer from "./Footer";

function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroSection />
      <FeaturesSection />
      <CoreFeatures />
      <CodeShowcase />
      <Footer />
    </div>
  );
}

export default Landing;
