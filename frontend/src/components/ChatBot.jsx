import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm your AI Engineering Assistant. How can I help you analyze your delivery data today?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, isBot: false };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            const aiResponse = getAiResponse(input);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponse, isBot: true }]);
            setIsTyping(false);
        }, 1500);
    };

    const getAiResponse = (query) => {
        const q = query.toLowerCase();

        // Knowledge Base Expansion
        if (q.includes("delivery") || q.includes("health")) {
            return "Based on Sprint 24 data, delivery health is currently at 98.2%. The main factor is the stabilization of the backend team velocity and a 12% reduction in scope creep.";
        }
        if (q.includes("risk") || q.includes("bottleneck")) {
            return "I've detected a high delivery risk in the backend area due to team overload in the Auth service. I recommend reallocating 2 senior engineers from the legacy cleanup initiative to assist.";
        }
        if (q.includes("cost") || q.includes("budget") || q.includes("finance") || q.includes("burn")) {
            return "Current budget utilization is at 92%. We detected a slight overage in Sprint 22 due to cloud infrastructure scaling for the Mobile App load tests, but our predictive burn forecast shows we will finish Q3 under budget by 2%.";
        }
        if (q.includes("workforce") || q.includes("productivity") || q.includes("morale")) {
            return "Engineering productivity is trending upwards, currently at 124.5. Code review turnaround times have improved by 18%, and team engagement scores are high (4.8/5) following the recent tech stack upgrade.";
        }
        if (q.includes("dora") || q.includes("cycle") || q.includes("lead time")) {
            return "Our DORA metrics are strong: Cycle time is down to 3.2 days, and Deployment Frequency has increased to 4.2 deploys/day. Change Failure Rate remains stable at 1.5%.";
        }
        if (q.includes("tech debt") || q.includes("legacy") || q.includes("refactor")) {
            return "Technical debt is currently estimated at 14% of the codebase. The 'Auth Rewrite' initiative is successfully reducing this in the core engine, though the 'Legacy Cleanup' in the reporting module has been deprioritized due to low ROI.";
        }
        if (q.includes("velocity") || q.includes("sprint")) {
            return "Sprint velocity has averaged 142 story points over the last 3 sprints. We see a slight dip in the Frontend squad due to the Login page redesign, but it's expected to bounce back next cycle.";
        }
        if (q.includes("hello") || q.includes("hi") || q.includes("help")) {
            return "Hello! I can help you analyze delivery health, engineering risks, tech debt, DORA metrics, costs, and workforce productivity. Try asking 'What's our current delivery risk?' or 'Show me budget insights'.";
        }

        return "I'm not quite sure about that specific query. However, I can provide detailed insights on: \n1. Delivery Health & Risks\n2. DORA Metrics (Lead Time, Cycle Time)\n3. Technical Debt status\n4. Financial & Budget burn forecasts\n5. Workforce Productivity levels.\n\nWhich of these would you like to explore?";
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 backdrop-blur-md transition-colors duration-300",
                    isOpen ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-[350px] md:w-[420px] h-[550px] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border bg-gradient-to-r from-primary to-purple-600 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-3 text-primary-foreground">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight">EntelliGen AI Assistant</h3>
                                    <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-white/80 font-medium tracking-wide">Ready to Analyze</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent bg-gradient-to-b from-muted/20 to-transparent"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex items-start gap-3 max-w-[90%]",
                                        msg.isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl shrink-0 shadow-sm border",
                                        msg.isBot
                                            ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                            : "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        {msg.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                                        msg.isBot
                                            ? "bg-card text-foreground rounded-tl-none border border-border"
                                            : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-start gap-3 mr-auto">
                                    <div className="p-2 rounded-xl shrink-0 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-card p-3.5 rounded-2xl rounded-tl-none border border-border flex gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        <div className="px-4 py-3 border-t border-border bg-muted/20 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                            {["Delivery Health", "Sprint Velocity", "Tech Debt", "DORA Metrics", "Budget Forecast"].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setInput(tag)}
                                    className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-background hover:bg-primary/5 text-primary text-[10px] font-semibold transition-all border border-primary/10 hover:border-primary/30 shadow-sm ring-primary/5 hover:ring-2"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center gap-2"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about risks, DORA, tech debt..."
                                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12 transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                                    EntelliGen GPT • Intelligent Insights
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBot;
