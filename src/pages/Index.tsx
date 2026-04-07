import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CloudLightning, Loader2, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import EligibilityCriteria, { CriteriaConfig, DEFAULT_CRITERIA } from "@/components/EligibilityCriteria";
import { analyzeTender, generateProposal, extractTextFromPdf, parseCsvToTenders } from "@/lib/tender-api";
import { saveCompanyProfile, loadCompanyProfile } from "@/lib/company-storage";

const Index = () => {
  const { toast } = useToast();
  const [showDashboard, setShowDashboard] = useState(false);
  const [company, setCompany] = useState<CompanyData>(DEFAULT_COMPANY);
  const [criteria, setCriteria] = useState<CriteriaConfig>(DEFAULT_CRITERIA);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [tenderTitles, setTenderTitles] = useState<string[]>([]);
  const [selectedTender, setSelectedTender] = useState("");
  const [requirements, setRequirements] = useState<(TenderRequirements & Record<string, any>) | null>(null);
  const [eligibility, setEligibility] = useState<{ overall_score: number; checks: any[]; recommendation: string; risk_factors?: string[]; action_items?: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalText, setProposalText] = useState("");
  const [proposalReady, setProposalReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load saved company profile on mount
  useEffect(() => {
    loadCompanyProfile().then((saved) => {
      if (saved) {
        setCompany(saved);
        toast({ title: "Company profile loaded", description: "Your saved details were restored." });
      }
      setProfileLoaded(true);
    }).catch(() => setProfileLoaded(true));
  }, []);

  // Load saved criteria from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cuvoto_criteria");
    if (saved) {
      try { setCriteria(JSON.parse(saved)); } catch {}
    }
  }, []);

  const currentStep = !pdfFile ? 0 : !requirements ? 1 : !proposalReady ? 2 : 3;

  const steps = [
    { label: "Upload", completed: currentStep > 0, active: currentStep === 0 },
    { label: "Extract", completed: currentStep > 1, active: currentStep === 1 },
    { label: "Analyze", completed: currentStep > 2, active: currentStep === 2 },
    { label: "Submit", completed: currentStep > 3, active: currentStep === 3 },
  ];

  const handleCompanyEdit = async (updated: CompanyData) => {
    setCompany(updated);
    try {
      await saveCompanyProfile(updated);
      toast({ title: "Profile saved!", description: "Your company details are saved for future tenders." });
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      toast({ title: "Profile updated locally", description: "Could not save to cloud, but changes are applied." });
    }
  };

  const handleCriteriaSave = (c: CriteriaConfig) => {
    setCriteria(c);
    localStorage.setItem("cuvoto_criteria", JSON.stringify(c));
    toast({ title: "Eligibility criteria saved!" });
  };

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
            <span className="font-display font-bold text-foreground text-lg">Cuvoto Tender AI</span>
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
                            Analyzing Tender with AI (Deep Analysis)...
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

                      {/* Extra requirement details */}
                      {(requirements.emd_amount || requirements.tender_fee || requirements.bid_validity || requirements.deadline) && (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <h4 className="text-sm font-semibold text-foreground mb-3">📋 Key Tender Details</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {requirements.emd_amount && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">EMD Amount</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.emd_amount}</p>
                              </div>
                            )}
                            {requirements.tender_fee && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">Tender Fee</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.tender_fee}</p>
                              </div>
                            )}
                            {requirements.deadline && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">Submission Deadline</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.deadline}</p>
                              </div>
                            )}
                            {requirements.bid_validity && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">Bid Validity</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.bid_validity}</p>
                              </div>
                            )}
                            {requirements.tender_value && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">Tender Value</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.tender_value}</p>
                              </div>
                            )}
                            {requirements.pbg_percentage && (
                              <div className="rounded-md bg-muted p-2.5">
                                <p className="text-xs text-muted-foreground">PBG</p>
                                <p className="text-sm font-semibold text-foreground">{requirements.pbg_percentage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Technical criteria */}
                      {requirements.technical_criteria && requirements.technical_criteria.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <h4 className="text-sm font-semibold text-foreground mb-3">📊 Technical Evaluation Criteria</h4>
                          <div className="space-y-2">
                            {requirements.technical_criteria.map((tc: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-md bg-muted p-2.5">
                                <span className="text-sm text-foreground">{tc.criterion}</span>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                  {tc.max_marks && <span>Max: {tc.max_marks}</span>}
                                  {tc.minimum_required && <span className="text-accent">Min: {tc.minimum_required}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

                      {/* Risk factors */}
                      {eligibility?.risk_factors && eligibility.risk_factors.length > 0 && (
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            Risk Factors
                          </p>
                          <ul className="space-y-1">
                            {eligibility.risk_factors.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action items */}
                      {eligibility?.action_items && eligibility.action_items.length > 0 && (
                        <div className="rounded-lg bg-success/5 border border-success/20 p-4">
                          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            Action Items Before Submission
                          </p>
                          <ul className="space-y-1">
                            {eligibility.action_items.map((a, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Proposal Preview */}
                  {proposalReady && proposalText && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <ProposalPreview text={proposalText} company={company} />
                    </motion.div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6" ref={profileRef}>
                  <CompanyProfile company={company} onEdit={handleCompanyEdit} />
                  
                  <EligibilityCriteria criteria={criteria} onSave={handleCriteriaSave} />

                  {requirements && !proposalReady && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <MissingInfoCheck
                        company={company}
                        onEditProfile={() => {
                          profileRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        onProceedAnyway={() => {}}
                      />
                    </motion.div>
                  )}

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
