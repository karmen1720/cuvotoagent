import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CloudLightning } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/HeroSection";
import CompanyProfile, { CompanyData } from "@/components/CompanyProfile";
import TenderUploader from "@/components/TenderUploader";
import RequirementsDisplay, { TenderRequirements } from "@/components/RequirementsDisplay";
import EligibilityChecker from "@/components/EligibilityChecker";
import ProposalGenerator from "@/components/ProposalGenerator";
import StepIndicator from "@/components/StepIndicator";

const SAMPLE_COMPANY: CompanyData = {
  company_name: "Tuno Tech",
  msme: true,
  startup: true,
};

const SAMPLE_REQUIREMENTS: TenderRequirements = {
  documents: [
    "Company Registration Certificate",
    "GST Registration",
    "PAN Card Copy",
    "EMD (Earnest Money Deposit)",
    "Technical Bid Documents",
    "Financial Bid Documents",
  ],
  experience: "3+ years in IT services",
  turnover: "₹50 Lakhs annually",
  msme_benefits: [
    "EMD exemption available",
    "Prior experience relaxation",
    "Price preference up to 15%",
  ],
  startup_benefits: [
    "Turnover criteria relaxed",
    "Prior experience not mandatory",
    "DPIIT recognition accepted",
  ],
};

const SAMPLE_ELIGIBILITY = [
  { label: "MSME Registration", eligible: true, detail: "Your MSME registration is valid and verified" },
  { label: "Startup Certificate (DPIIT)", eligible: true, detail: "Recognized startup — turnover relaxation applies" },
  { label: "Minimum Experience", eligible: true, detail: "Experience requirement relaxed for startups" },
  { label: "Annual Turnover", eligible: true, detail: "Meets ₹50L threshold via startup exemption" },
  { label: "EMD Requirement", eligible: true, detail: "Exempted under MSME policy" },
  { label: "Technical Capability", eligible: false, detail: "Requires ISO 27001 — not yet certified" },
];

const TENDER_TITLES = [
  "Supply & Installation of Cloud Infrastructure for Smart City Project",
  "Development of AI-Based Traffic Management System",
  "Procurement of IT Hardware & Networking Equipment",
  "Annual Maintenance Contract for Government Portal",
];

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [company] = useState<CompanyData>(SAMPLE_COMPANY);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedTender] = useState(TENDER_TITLES[0]);
  const [showRequirements, setShowRequirements] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalReady, setProposalReady] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const currentStep = !excelFile && !pdfFile ? 0 : !showRequirements ? 1 : !proposalReady ? 2 : 3;

  const steps = [
    { label: "Upload", completed: currentStep > 0, active: currentStep === 0 },
    { label: "Extract", completed: currentStep > 1, active: currentStep === 1 },
    { label: "Analyze", completed: currentStep > 2, active: currentStep === 2 },
    { label: "Submit", completed: currentStep > 3, active: currentStep === 3 },
  ];

  const handleProcess = () => {
    setShowRequirements(true);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setProposalReady(true);
    }, 2500);
  };

  const handleGetStarted = () => {
    setShowDashboard(true);
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudLightning className="w-6 h-6 text-accent" />
            <span className="font-display font-bold text-foreground text-lg">Tuno Tender AI</span>
          </div>
          {showDashboard && (
            <Button variant="ghost" size="sm" onClick={() => setShowDashboard(false)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </header>

      <div className="pt-14">
        {/* Hero */}
        <AnimatePresence>
          {!showDashboard && (
            <motion.div
              key="hero"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSection onGetStarted={handleGetStarted} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard */}
        <AnimatePresence>
          {showDashboard && (
            <motion.div
              ref={dashboardRef}
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
            >
              <StepIndicator steps={steps} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Upload & Profile */}
                <div className="lg:col-span-2 space-y-6">
                  <TenderUploader
                    onExcelUpload={(file) => setExcelFile(file)}
                    onPdfUpload={(file) => setPdfFile(file)}
                    onSheetUrl={() => setExcelFile(new File([""], "google-sheet.csv"))}
                    excelFile={excelFile}
                    pdfFile={pdfFile}
                  />

                  {(excelFile || pdfFile) && !showRequirements && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button variant="hero" className="w-full" onClick={handleProcess}>
                        Process Tender Documents
                      </Button>
                    </motion.div>
                  )}

                  {showRequirements && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      <RequirementsDisplay requirements={SAMPLE_REQUIREMENTS} />
                      <EligibilityChecker results={SAMPLE_ELIGIBILITY} overallScore={83} />
                    </motion.div>
                  )}
                </div>

                {/* Right: Company + Proposal */}
                <div className="space-y-6">
                  <CompanyProfile company={company} onEdit={() => {}} />

                  {showRequirements && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ProposalGenerator
                        tenderTitle={selectedTender}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        proposalReady={proposalReady}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
