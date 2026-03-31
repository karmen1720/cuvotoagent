import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CloudLightning, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/HeroSection";
import CompanyProfile, { CompanyData, DEFAULT_COMPANY } from "@/components/CompanyProfile";
import TenderUploader from "@/components/TenderUploader";
import RequirementsDisplay, { TenderRequirements } from "@/components/RequirementsDisplay";
import EligibilityChecker from "@/components/EligibilityChecker";
import ProposalGenerator from "@/components/ProposalGenerator";
import StepIndicator from "@/components/StepIndicator";
import ProposalPreview from "@/components/ProposalPreview";
import MissingInfoCheck from "@/components/MissingInfoCheck";
import { analyzeTender, generateProposal, extractTextFromPdf, parseCsvToTenders } from "@/lib/tender-api";

const Index = () => {
  const { toast } = useToast();
  const [showDashboard, setShowDashboard] = useState(false);
  const [company, setCompany] = useState<CompanyData>(DEFAULT_COMPANY);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [tenderTitles, setTenderTitles] = useState<string[]>([]);
  const [selectedTender, setSelectedTender] = useState("");
  const [requirements, setRequirements] = useState<TenderRequirements | null>(null);
  const [eligibility, setEligibility] = useState<{ overall_score: number; checks: any[]; recommendation: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [proposalReady, setProposalReady] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showMissingCheck, setShowMissingCheck] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentStep = !pdfFile ? 0 : !requirements ? 1 : !proposalReady ? 2 : 3;

  const steps = [
    { label: "Upload", completed: currentStep > 0, active: currentStep === 0 },
    { label: "Extract", completed: currentStep > 1, active: currentStep === 1 },
    { label: "Analyze", completed: currentStep > 2, active: currentStep === 2 },
    { label: "Submit", completed: currentStep > 3, active: currentStep === 3 },
  ];

  const handleExcelUpload = async (file: File) => {
    setExcelFile(file);
    try {
      const text = await file.text();
      const titles = parseCsvToTenders(text);
      if (titles.length > 0) {
        setTenderTitles(titles);
        setSelectedTender(titles[0]);
        toast({ title: `Loaded ${titles.length} tenders from spreadsheet` });
      } else {
        toast({ title: "No tender titles found", description: "Make sure your file has a 'Tender Title' column", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to parse file", variant: "destructive" });
    }
  };

  const handleSheetUrl = async (url: string) => {
    try {
      const csvUrl = url.replace("/edit?usp=sharing", "/export?format=csv").replace("/edit#gid=", "/export?format=csv&gid=");
      const resp = await fetch(csvUrl);
      if (!resp.ok) throw new Error("Failed to fetch sheet");
      const text = await resp.text();
      const titles = parseCsvToTenders(text);
      if (titles.length > 0) {
        setTenderTitles(titles);
        setSelectedTender(titles[0]);
        setExcelFile(new File([text], "google-sheet.csv"));
        toast({ title: `Loaded ${titles.length} tenders from Google Sheet` });
      }
    } catch {
      toast({ title: "Failed to load Google Sheet", description: "Make sure the sheet is publicly accessible", variant: "destructive" });
    }
  };

  const handleProcess = async () => {
    if (!pdfFile) {
      toast({ title: "Please upload a tender PDF first", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const pdfText = await extractTextFromPdf(pdfFile);
      const result = await analyzeTender(pdfText, company);
      
      setRequirements(result.requirements);
      if (result.eligibility) {
        setEligibility(result.eligibility);
      }
      
      if (!selectedTender && result.requirements.summary) {
        setSelectedTender(result.requirements.summary.substring(0, 80));
      }
      
      toast({ title: "Tender analyzed successfully!" });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!requirements) return;
    setIsGenerating(true);
    try {
      const proposal = await generateProposal(
        selectedTender || "Untitled Tender",
        requirements,
        eligibility,
        company
      );
      setProposalText(proposal);
      setProposalReady(true);
      toast({ title: "Proposal generated!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetStarted = () => {
    setShowDashboard(true);
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setExcelFile(null);
    setPdfFile(null);
    setTenderTitles([]);
    setSelectedTender("");
    setRequirements(null);
    setEligibility(null);
    setProposalText("");
    setProposalReady(false);
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
          <div className="flex items-center gap-2">
            {showDashboard && requirements && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                New Tender
              </Button>
            )}
            {showDashboard && (
              <Button variant="ghost" size="sm" onClick={() => setShowDashboard(false)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="pt-14">
        <AnimatePresence mode="wait">
          {!showDashboard && (
            <motion.div key="hero" exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3 }}>
              <HeroSection onGetStarted={handleGetStarted} />
            </motion.div>
          )}
        </AnimatePresence>

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
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                  <TenderUploader
                    onExcelUpload={handleExcelUpload}
                    onPdfUpload={(file) => setPdfFile(file)}
                    onSheetUrl={handleSheetUrl}
                    excelFile={excelFile}
                    pdfFile={pdfFile}
                  />

                  {/* Tender selector */}
                  {tenderTitles.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-4">
                      <label className="text-sm font-semibold text-foreground mb-2 block">Select Tender</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedTender}
                        onChange={(e) => setSelectedTender(e.target.value)}
                      >
                        {tenderTitles.map((t, i) => (
                          <option key={i} value={t}>{t}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {/* Process button */}
                  {pdfFile && !requirements && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button variant="hero" className="w-full" onClick={handleProcess} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing Tender with AI...
                          </>
                        ) : (
                          "Process Tender Documents"
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {/* Results */}
                  {requirements && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <RequirementsDisplay requirements={requirements} />
                      {eligibility && (
                        <EligibilityChecker results={eligibility.checks} overallScore={eligibility.overall_score} />
                      )}
                      {eligibility?.recommendation && (
                        <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                          <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-accent" />
                            AI Recommendation
                          </p>
                          <p className="text-sm text-muted-foreground">{eligibility.recommendation}</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Proposal Preview */}
                  {proposalReady && proposalText && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <ProposalPreview text={proposalText} />
                    </motion.div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <CompanyProfile company={company} onEdit={setCompany} />

                  {requirements && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <ProposalGenerator
                        tenderTitle={selectedTender || "Tender Document"}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        proposalReady={proposalReady}
                        proposalText={proposalText}
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
