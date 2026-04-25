import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Gavel, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  FileText, 
  Zap, 
  Code,
  Layout,
  Palette,
  Target,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebsiteData {
  url: string;
  title: string;
  headings: number;
  images: number;
  buttons: number;
  links: number;
  colors: string[];
  hasNavbar: boolean;
  hasFooter: boolean;
  hasCTA: boolean;
  textDensity: string;
  metaViewport: boolean;
}

interface Analysis {
  issues: { id: string; charge: string; detail: string }[];
  defense: string[];
}

interface AIResponse {
  score: number;
  verdict: 'GUILTY' | 'NOT GUILTY';
  verdictText: string;
  sentence: string[];
  redesignPrompt: string;
  sitePurpose: string;
}

interface AuditData {
  websiteData: WebsiteData;
  analysis: Analysis;
  aiResponse: AIResponse;
  vibeStatus: string;
  agentSteps: { step: string; status: string; data?: any }[];
  logs: string[];
  timestamp: string;
  source: string;
}

const steps = [
  { id: 'FETCH', label: 'FETCH', icon: Search },
  { id: 'PARSE', label: 'PARSE', icon: Code },
  { id: 'ANALYZE', label: 'ANALYZE', icon: Target },
  { id: 'JUDGE', label: 'JUDGE', icon: Scale },
  { id: 'ACT', label: 'ACT', icon: Zap },
];

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [showEvidence, setShowEvidence] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startTrial = async () => {
    if (!url) return;
    setLoading(true);
    setAuditData(null);
    setErrorMsg(null);
    setCurrentStep(0);

    try {
      // Simulate step progression for UI effect
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 1500);

      const response = await axios.post('/api/audit', { url });
      clearInterval(interval);
      setCurrentStep(4);
      setAuditData(response.data);
    } catch (error: any) {
      console.error('Trial error:', error);
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      setErrorMsg(`Trial interrupted: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    if (auditData?.aiResponse.redesignPrompt) {
      navigator.clipboard.writeText(auditData.aiResponse.redesignPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="mb-12 text-center w-full max-w-4xl">
        <div className="flex flex-col items-center gap-4 mb-6">
          <img 
            src="/judge.png" 
            alt="Pixel Judge" 
            className="w-24 h-24 pixel-corners border-4 border-court-gold shadow-[8px_8px_0px_#000]"
          />
          <h1 className="font-pixel text-2xl md:text-3xl text-court-gold leading-relaxed">
            UI COURT: WEBSITE ON TRIAL
          </h1>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col md:flex-row gap-4 w-full bg-black/40 p-6 pixel-border">
          <input 
            type="text" 
            placeholder="PASTE WEBSITE URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#2a1a17] border-2 border-court-gold p-4 font-pixel text-xs text-court-gold placeholder:text-court-gold/30 focus:outline-none"
          />
          <button 
            onClick={startTrial}
            disabled={loading}
            className="bg-court-gold text-court-brown font-pixel px-8 py-4 px-2 hover:bg-[#e0b54d] active:translate-y-1 transition-all disabled:opacity-50"
          >
            {loading ? 'RUNNING...' : 'START TRIAL'}
          </button>
        </div>
      </header>

      {/* Timeline */}
      <div className="w-full max-w-4xl mb-12">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-court-gold/20 -translate-y-1/2 -z-10" />
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`
                w-12 h-12 flex items-center justify-center pixel-corners border-4 transition-all duration-500
                ${currentStep >= index ? 'bg-court-gold border-white text-court-brown' : 'bg-court-brown border-court-gold text-court-gold'}
              `}>
                <step.icon size={20} />
              </div>
              <span className={`font-pixel text-[10px] ${currentStep >= index ? 'text-court-gold' : 'text-court-gold/30'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Agent Thought Box */}
        <div className="mt-8 bg-[#2a1a17]/80 p-4 border-l-4 border-court-gold font-body text-sm italic text-court-gold/80 min-h-[60px]">
          <span className="font-pixel text-xs not-italic block mb-2 underline">AGENT THOUGHTS:</span>
          {errorMsg ? (
            <p className="text-red-400 not-italic">{errorMsg}</p>
          ) : loading ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              Analyzing {url}... Step {currentStep + 1} in progress...
            </motion.p>
          ) : auditData ? (
            <p>{auditData.logs[auditData.logs.length - 1]}</p>
          ) : (
            <p>Awaiting evidence. Provide a URL to begin the hearing.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {auditData && (
          <motion.main 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl space-y-8"
          >
            {/* Top Row: Verdict & Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="pixel-border bg-black/40 p-6 flex flex-col items-center justify-center text-center">
                <span className="font-pixel text-xs mb-4 underline opacity-60">VERDICT</span>
                <h3 className={`font-pixel text-2xl ${auditData.aiResponse.verdict === 'GUILTY' ? 'text-red-500' : 'text-green-500'}`}>
                  {auditData.aiResponse.verdict}
                </h3>
                <p className="mt-4 text-sm opacity-80">{auditData.aiResponse.verdictText}</p>
              </div>

              <div className="pixel-border bg-black/40 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="font-pixel text-xs mb-4 underline opacity-60">UI SCORE</span>
                <div className="flex items-baseline gap-1">
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="font-pixel text-5xl text-court-gold"
                  >
                    {auditData.aiResponse.score}
                  </motion.span>
                  <span className="font-pixel text-xl opacity-40">/100</span>
                </div>
                <img 
                  src="/gavel.png" 
                  className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 rotate-12 animate-gavel" 
                  alt=""
                />
              </div>

              <div className="pixel-border bg-black/40 p-6 flex flex-col">
                <button 
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="flex items-center justify-between font-pixel text-xs text-court-gold w-full"
                >
                  EVIDENCE (API DATA)
                  {showEvidence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="mt-4 overflow-hidden">
                  <AnimatePresence>
                    {showEvidence && (
                      <motion.pre 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-black/60 p-4 text-[10px] font-mono text-green-400 overflow-x-auto"
                      >
                        {JSON.stringify(auditData.websiteData, null, 2)}
                        {'\n'}Timestamp: {auditData.timestamp}
                        {'\n'}Source: {auditData.source}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                  {!showEvidence && (
                    <div className="text-[10px] space-y-1 opacity-60">
                      <p>• Title: {auditData.websiteData.title.substring(0, 30)}...</p>
                      <p>• Headings: {auditData.websiteData.headings}</p>
                      <p>• Buttons: {auditData.websiteData.buttons}</p>
                      <p>• Colors: {auditData.websiteData.colors.length}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Row: Charges & Defense */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="pixel-border border-red-500/50 bg-red-900/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="text-red-500" />
                  <h4 className="font-pixel text-sm text-red-500">CHARGES (ISSUES)</h4>
                </div>
                <ul className="space-y-4">
                  {auditData.analysis.issues.map((issue, i) => (
                    <li key={i} className="border-l-2 border-red-500 pl-3">
                      <strong className="block text-xs font-pixel text-red-400 mb-1">{issue.charge}</strong>
                      <p className="text-sm opacity-80">{issue.detail}</p>
                    </li>
                  ))}
                  {auditData.analysis.issues.length === 0 && <li className="opacity-40">No charges filed.</li>}
                </ul>
              </div>

              <div className="pixel-border border-green-500/50 bg-green-900/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="text-green-500" />
                  <h4 className="font-pixel text-sm text-green-500">DEFENSE (WORKS)</h4>
                </div>
                <ul className="space-y-3">
                  {auditData.analysis.defense.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm opacity-80">
                      <span className="text-green-500 opacity-60">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sentence */}
            <div className="pixel-border bg-court-gold/10 p-6">
              <h4 className="font-pixel text-sm mb-6 flex items-center gap-2">
                <Gavel className="text-court-gold" /> SENTENCING ORDER
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {auditData.aiResponse.sentence.map((s, i) => (
                  <div key={i} className="bg-black/40 p-4 border-2 border-court-gold/30 text-sm">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Vibe Detector */}
            <div className={`p-6 pixel-corners border-4 flex items-center justify-between transition-colors
              ${auditData.vibeStatus.includes('READY') ? 'bg-green-600/20 border-green-500' : 'bg-yellow-600/20 border-yellow-500'}
            `}>
              <div className="flex items-center gap-3">
                <Zap className={auditData.vibeStatus.includes('READY') ? 'text-green-500' : 'text-yellow-500'} />
                <span className="font-pixel text-sm">VIBE UI DETECTOR:</span>
              </div>
              <span className="font-pixel text-sm underline decoration-2 underline-offset-4">{auditData.vibeStatus}</span>
            </div>

            {/* Redesign Prompt */}
            <div className="pixel-border bg-black/60 p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h4 className="font-pixel text-sm text-court-gold">REDESIGN ORDER (REHABILITATION PLAN)</h4>
                <button 
                  onClick={copyPrompt}
                  className="flex items-center gap-2 bg-court-gold text-court-brown px-4 py-2 font-pixel text-[10px] active:scale-95 transition-transform"
                >
                  <Copy size={14} /> {copied ? 'COPIED!' : 'COPY PROMPT'}
                </button>
              </div>
              <div className="bg-[#1a110f] p-6 text-sm font-mono border-2 border-court-gold/20 leading-relaxed text-court-gold/90 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {auditData.aiResponse.redesignPrompt}
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <footer className="mt-20 opacity-40 font-pixel text-[8px] text-center">
        GDG MANILA HACKATHON 2026 // AI AGENT CATEGORY // POWERED BY GEMINI
      </footer>
    </div>
  );
}

export default App;
