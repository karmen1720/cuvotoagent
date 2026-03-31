import { motion } from "framer-motion";
import { Upload, Zap, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-primary/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(174_62%_47%/0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(220_60%_30%/0.2),transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI-Powered Tender Processing</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
            Win More Tenders
            <br />
            <span className="text-accent">With AI Intelligence</span>
          </h1>

          <p className="text-primary-foreground/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload tender documents, extract requirements instantly, check eligibility,
            and generate professional proposals — all in one workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" onClick={onGetStarted} className="text-base px-8 py-6">
              Start Processing
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Upload, label: "Upload PDF & Excel", desc: "Drag & drop tender documents" },
            { icon: Zap, label: "AI Extraction", desc: "Requirements parsed instantly" },
            { icon: FileCheck, label: "Auto Proposal", desc: "Generate & download submissions" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-accent/15 bg-primary/40 backdrop-blur-sm px-4 py-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-primary-foreground">{item.label}</p>
                <p className="text-xs text-primary-foreground/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
