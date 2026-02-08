import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, MessageSquare, Briefcase, ArrowRight, Check, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
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
    }
];

const IntegrationOnboarding = () => {
    const { currentUser, userData, setOnboardingComplete, saveSelectedIntegrations, saveJiraCredentials } = useAuth();
    const [selected, setSelected] = useState([]);
    const [step, setStep] = useState('select'); // 'select' | 'jira-auth' | 'github-alert'
    const [countdown, setCountdown] = useState(5);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    // Jira Form State
    const [jiraCreds, setJiraCreds] = useState({
        url: 'https://',
        email: '',
        token: ''
    });
    const [jiraLoading, setJiraLoading] = useState(false);
    const [jiraError, setJiraError] = useState(null);
    const [jiraSuccess, setJiraSuccess] = useState(false);
    const [jiraAccessToken, setJiraAccessToken] = useState('');

    // Force the modal to stay open once the final alert or finishing process starts
    const forceOpen = step === 'github-alert' || step === 'jira-auth' || isFinishing;
    const showModal = currentUser && userData && (!userData.onboardingCompleted || forceOpen);

    const toggleIntegration = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (selected.length === 0) return;

        if (step === 'select') {
            if (selected.includes('jira')) {
                setStep('jira-auth');
            } else if (selected.includes('github')) {
                setStep('github-alert');
            } else {
                finalizeOnboarding();
            }
        } else if (step === 'jira-auth') {
            if (selected.includes('github')) {
                setStep('github-alert');
            } else {
                finalizeOnboarding();
            }
        }
    };

    const handleJiraAuth = async (e) => {
        e.preventDefault();
        setJiraLoading(true);
        setJiraError(null);

        try {
            const response = await fetch('https://rudraaaa76-jira-api.hf.space/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    jira_server_url: jiraCreds.url,
                    jira_email: jiraCreds.email,
                    jira_api_token: jiraCreds.token
                })
            });

            if (!response.ok) throw new Error('Jira authentication failed. Please check your credentials.');

            const data = await response.json();
            console.log("Jira Auth Successful:", data);
            console.log("Access token to save:", data.access_token);

            // Store token for future use
            if (data.access_token) {
                localStorage.setItem('jira_access_token', data.access_token);
                setJiraAccessToken(data.access_token);
                
                // Fetch comprehensive Jira data using the access token
                try {
                    console.log("🔍 Calling /webhooks/jira...");
                    console.log("🔑 ACCESS TOKEN:", data.access_token);
                    
                    let jiraData = null;
                    let jiraAccountId = null;

                    try {
                        console.log(`\n📡 POST /webhooks/jira...`);
                        const webhookResponse = await fetch(`https://rudraaaa76-jira-api.hf.space/webhooks/jira`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${data.access_token}`,
                                'Content-Type': 'application/json',
                                'accept': 'application/json'
                            },
                            body: JSON.stringify({
                                access_token: data.access_token
                            })
                        });

                        console.log(`Response: ${webhookResponse.status} ${webhookResponse.statusText}`);

                        if (webhookResponse.ok) {
                            const webhookText = await webhookResponse.text();
                            console.log(`Raw response (first 300 chars):`, webhookText.substring(0, 300));
                            
                            try {
                                jiraData = JSON.parse(webhookText);
                                jiraAccountId = jiraData.account_id || jiraData.user?.accountId || null;
                                console.log(`✅ Got response from /webhooks/jira`);
                                console.log("Account ID:", jiraAccountId);
                                console.log("Response keys:", Object.keys(jiraData));
                            } catch (parseErr) {
                                console.error(`❌ JSON parse error:`, parseErr.message);
                            }
                        } else {
                            const errorText = await webhookResponse.text();
                            console.error(`❌ /webhooks/jira failed:`, errorText.substring(0, 200));
                        }
                    } catch (webhookErr) {
                        console.error(`❌ Exception calling /webhooks/jira:`, webhookErr.message);
                    }

                    if (jiraData && jiraAccountId) {
                        console.log(`\n✅✅✅ SUCCESS! Got account ID and Jira data`);
                        console.log("Account ID:", jiraAccountId);
                        console.log("📊 Data structure:");
                        console.log("- Assigned issues:", jiraData.assigned_issues?.length || 0);
                        console.log("- Boards:", jiraData.boards?.length || 0);
                        console.log("- Projects:", jiraData.projects?.length || 0);
                        
                        console.log("💾 Saving to Supabase...");
                        await saveJiraCredentials(
                            jiraCreds.url,
                            jiraCreds.email,
                            jiraCreds.token,
                            data.access_token,
                            jiraAccountId,
                            jiraData
                        );
                        console.log("✅ Jira credentials and data saved!");
                    } else if (jiraData) {
                        console.log(`\n✅ Got response from /webhooks/jira`);
                        console.log("💾 Saving to Supabase...");
                        await saveJiraCredentials(
                            jiraCreds.url,
                            jiraCreds.email,
                            jiraCreds.token,
                            data.access_token,
                            jiraAccountId,
                            jiraData
                        );
                        console.log("✅ Jira credentials and data saved!");
                    } else {
                        console.error("\n❌ /webhooks/jira call failed");
                        console.log("\n⚠️ Saving credentials without data...");
                        await saveJiraCredentials(
                            jiraCreds.url,
                            jiraCreds.email,
                            jiraCreds.token,
                            data.access_token,
                            null,
                            null
                        );
                    }
                } catch (fetchErr) {
                    console.error("❌ Exception while fetching Jira data:", fetchErr);
                    console.error("Error details:", fetchErr.message, fetchErr.stack);
                    // Still save credentials even if data fetch fails
                    await saveJiraCredentials(
                        jiraCreds.url,
                        jiraCreds.email,
                        jiraCreds.token,
                        data.access_token,
                        null,  // No account_id available
                        null   // Don't save auth response as jira_data
                    );
                }
                
                setJiraSuccess(true);
            }
        } catch (err) {
            console.error("Jira Auth Error:", err);
            setJiraError(err.message);
        } finally {
            setJiraLoading(false);
        }
    };

    const finalizeOnboarding = async () => {
        setIsFinishing(true);
        setIsExecuting(true);
        try {
            console.log("Selected integrations:", selected);
            
            // Save selected integrations to database
            await saveSelectedIntegrations(selected);
            console.log("Integrations saved, marking onboarding complete");
            
            // Mark onboarding as complete
            await setOnboardingComplete();
            console.log("Onboarding marked complete");

            // Small delay to ensure Firebase writes complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Redirect to dashboard
            console.log("Redirecting to dashboard");
            window.location.assign('/');
        } catch (error) {
            console.error("Onboarding finalization failed:", error);
        } finally {
            setIsExecuting(false);
        }
    };

    useEffect(() => {
        let timer;
        if (step === 'github-alert' && countdown > 0) {
            // Redirect to GitHub immediately when github-alert step is shown
            if (countdown === 5 && currentUser?.uid) {
                const githubInstallUrl = `https://github.com/apps/codesage-by-algorithm-avengers/installations/new?state=${currentUser.uid}`;
                window.location.href = githubInstallUrl;
            }
            
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (step === 'github-alert' && countdown === 0) {
            finalizeOnboarding();
        }
        return () => clearInterval(timer);
    }, [step, countdown, currentUser]);

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
                            ) : step === 'jira-auth' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-[#0052CC]/10 border border-[#0052CC]/20 rounded-xl">
                                            <Briefcase className="h-6 w-6 text-[#0052CC]" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Jira Configuration</h2>
                                            <p className="text-sm text-muted-foreground">Authorize EntelliGen to analyze your Jira workspace.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleJiraAuth} className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jira Server URL</label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://your-domain.atlassian.net"
                                                value={jiraCreds.url}
                                                onChange={(e) => setJiraCreds({ ...jiraCreds, url: e.target.value })}
                                                className="w-full h-11 bg-muted/50 border border-border rounded-xl px-4 outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jira Email</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="name@company.com"
                                                value={jiraCreds.email}
                                                onChange={(e) => setJiraCreds({ ...jiraCreds, email: e.target.value })}
                                                className="w-full h-11 bg-muted/50 border border-border rounded-xl px-4 outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jira API Token</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Paste your API token here"
                                                value={jiraCreds.token}
                                                onChange={(e) => setJiraCreds({ ...jiraCreds, token: e.target.value })}
                                                className="w-full h-11 bg-muted/50 border border-border rounded-xl px-4 outline-none focus:border-primary transition-colors"
                                            />
                                        </div>

                                        {jiraError && (
                                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" /> {jiraError}
                                            </div>
                                        )}

                                        {jiraSuccess && (
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" /> Jira authenticated successfully!
                                            </div>
                                        )}

                                        {jiraAccessToken && (
                                            <div className="p-3 bg-muted/40 border border-border rounded-lg text-[10px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold uppercase text-muted-foreground">Access token</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(jiraAccessToken)}
                                                        className="text-primary font-bold text-[10px] hover:underline"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <div className="mt-2 break-all font-mono text-foreground/80">
                                                    {jiraAccessToken}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Need a token?</p>
                                                <a
                                                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-primary hover:underline font-bold"
                                                >
                                                    Generate it here →
                                                </a>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={jiraLoading || jiraSuccess}
                                                className="h-11 px-8 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {jiraLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
                                            </button>
                                        </div>

                                        {jiraSuccess && (
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="h-11 w-full bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all"
                                            >
                                                Continue
                                            </button>
                                        )}
                                    </form>

                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-[11px] text-muted-foreground space-y-2">
                                        <p className="font-bold flex items-center gap-2 text-primary">
                                            <Info className="h-3.5 w-3.5" /> How to connect:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Log in to your Atlassian account.</li>
                                            <li>Navigate to <b>Security</b> and click <b>Create API Token</b>.</li>
                                            <li>Copy the token and paste it above along with your domain.</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default IntegrationOnboarding;
