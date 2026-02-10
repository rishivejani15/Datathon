import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, MessageSquare, Briefcase, ArrowRight, Check, CheckCircle2, AlertCircle, Info, Loader2, FileSpreadsheet, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const INTEGRATIONS = [
    {
        id: 'github',
        name: 'GitHub',
        icon: Github,
        color: 'text-[#24292F]',
        bg: 'bg-[#24292F]/5',
        border: 'border-[#24292F]/20',
        url: 'https://github.com/apps/codesage-by-algorithm-avengers'
    },
    {
        id: 'jira',
        name: 'Jira',
        icon: Briefcase,
        color: 'text-[#0052CC]',
        bg: 'bg-[#0052CC]/5',
        border: 'border-[#0052CC]/20',
        url: 'https://atlassian.com'
    },
    {
        id: 'slack',
        name: 'Slack',
        icon: MessageSquare,
        color: 'text-[#4A154B]',
        bg: 'bg-[#4A154B]/5',
        border: 'border-[#4A154B]/20',
        url: 'https://slack.com'
    },
    {
        id: 'sheets',
        name: 'Google Sheets',
        icon: FileSpreadsheet,
        color: 'text-[#0F9D58]',
        bg: 'bg-[#0F9D58]/5',
        border: 'border-[#0F9D58]/20',
        url: '#'
    }
];

const IntegrationOnboarding = () => {
    const { currentUser, userData, setOnboardingComplete } = useAuth();
    const [selected, setSelected] = useState([]);
    const [step, setStep] = useState('select'); // 'select' | 'github-alert'
    const [countdown, setCountdown] = useState(5);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');

    // Force the modal to stay open once the final alert or finishing process starts
    const forceOpen = step === 'github-alert' || step === 'connect-sheets' || isFinishing;
    const showModal = currentUser && userData && (!userData.onboardingCompleted || forceOpen);

    const toggleIntegration = (id) => {
        // Single selection mode to prevent confusion
        setSelected(prev => [id]);
    };

    const handleNext = async () => {
        if (selected.length === 0) return;

        if (selected.includes('sheets') && !sheetUrl) {
            setStep('connect-sheets');
            return;
        }

        if (selected.includes('github')) {
            setStep('github-alert');
        } else {
            finalizeOnboarding();
        }
    };

    const handleSheetConnect = () => {
        if (!sheetUrl) return;

        // Basic validation or transformation could happen here
        // For now, we just save the URL. In a real app, we'd probably extract the ID 
        // and construct a CSV export URL.
        localStorage.setItem('finance_sheet_url', sheetUrl);

        // Proceed
        if (selected.includes('github')) {
            setStep('github-alert');
        } else {
            finalizeOnboarding();
        }
    };

    const finalizeOnboarding = async () => {
        setIsFinishing(true);
        setIsExecuting(true);
        try {
            await setOnboardingComplete();

            // Filter for external URLs only (ignore '#' for internal/sheets)
            const externalTargets = selected
                .map(id => INTEGRATIONS.find(i => i.id === id))
                .filter(i => i && i.url && i.url !== '#');

            // Open external integrations in new tabs
            externalTargets.forEach(target => {
                window.open(target.url, '_blank');
            });

            // Reload the page to reflect the completed state and close modal
            window.location.reload();
        } catch (error) {
            console.error("Onboarding finalization failed:", error);
        } finally {
            setIsExecuting(false);
        }
    };

    useEffect(() => {
        let timer;
        if (step === 'github-alert' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (step === 'github-alert' && countdown === 0) {
            finalizeOnboarding();
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    return (
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-emerald-500" />

                        <div className="p-10 space-y-8">
                            {step === 'select' ? (
                                <>
                                    <div className="text-center space-y-3">
                                        <h2 className="text-3xl font-extrabold tracking-tight">Connect Your Workspace</h2>
                                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                                            Select the tools you use to sync your engineering data and unlock AI-driven insights.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {INTEGRATIONS.map((app) => (
                                            <button
                                                key={app.id}
                                                onClick={() => toggleIntegration(app.id)}
                                                className={cn(
                                                    "group relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300",
                                                    selected.includes(app.id)
                                                        ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                                                        : "bg-muted/30 border-transparent hover:border-border/50 hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                                                    app.bg, app.border
                                                )}>
                                                    <app.icon className={cn("h-8 w-8", app.color)} />
                                                </div>
                                                <span className="mt-4 font-bold text-sm">{app.name}</span>

                                                {selected.includes(app.id) && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-3 right-3 p-1 bg-primary text-primary-foreground rounded-full"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col items-center gap-4 pt-4">
                                        <button
                                            onClick={handleNext}
                                            disabled={selected.length === 0}
                                            className="w-full md:w-64 h-12 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                                        >
                                            Next Step <ArrowRight className="h-4 w-4" />
                                        </button>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
                                            <Info className="h-3 w-3" /> You can add more integrations later
                                        </p>
                                    </div>
                                </>
                            ) : step === 'connect-sheets' ? (
                                <div className="flex flex-col items-center text-center space-y-8 py-4">
                                    <div className="p-6 rounded-full bg-[#0F9D58]/10 mb-2">
                                        <FileSpreadsheet className="h-12 w-12 text-[#0F9D58]" />
                                    </div>

                                    <div className="space-y-4 max-w-md">
                                        <h2 className="text-2xl font-bold tracking-tight">Connect Google Sheet</h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            Enter the public share link (CSV export or published) of your Google Sheet to sync your finance data.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-sm space-y-4">
                                        <div className="relative">
                                            <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="url"
                                                value={sheetUrl}
                                                onChange={(e) => setSheetUrl(e.target.value)}
                                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                                className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0F9D58]/50 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSheetConnect}
                                            disabled={!sheetUrl}
                                            className="w-full h-10 bg-[#0F9D58] text-white font-medium rounded-lg hover:bg-[#0F9D58]/90 transition-colors disabled:opacity-50"
                                        >
                                            Connect & Sync
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            Make sure the sheet is visible to "Anyone with the link"
                                        </p>
                                    </div>
                                </div>
                            ) : step === 'github-alert' ? (
                                <div className="flex flex-col items-center text-center space-y-8 py-4">
                                    <div className="relative">
                                        <div className="h-24 w-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                                            <span className="text-4xl font-black text-indigo-500">{countdown}s</span>
                                        </div>
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-2 text-indigo-500">
                                            <Github className="h-6 w-6" />
                                            <h2 className="text-3xl font-extrabold tracking-tight">GitHub Installation</h2>
                                        </div>
                                        <div className="max-w-md p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                            <p className="text-lg font-medium leading-relaxed">
                                                Please click <span className="text-indigo-500 font-bold underline">Install</span> and provide access to your necessary GitHub repositories on the next page.
                                            </p>
                                        </div>
                                        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to GitHub App...
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                                        {[
                                            "One-click app installation",
                                            "Secure repository access",
                                            "Automated data syncing"
                                        ].map((text, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground font-medium bg-muted/20 p-3 rounded-lg border border-border/50">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                {text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence >
    );
};

export default IntegrationOnboarding;
