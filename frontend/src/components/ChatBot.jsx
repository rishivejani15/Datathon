import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm your AI Engineering Assistant. How can I help you analyze your delivery data today?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    const { currentUser } = useAuth();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, isBot: false };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        // Convert messages to history format for the LLM
        const history = messages.slice(-5).map(m => ({
            role: m.isBot ? "assistant" : "user",
            content: m.text
        }));

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    firebase_id: currentUser?.uid || "anonymous",
                    history: history
                }),
            });

            if (!response.ok) throw new Error('Backend unreachable');

            const data = await response.json();
            setMessages(prev => [...prev, { id: Date.now() + 1, text: data.response, isBot: true }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "### ⚠️ Connectivity Issue\nI'm having trouble connecting to my backend service. Please ensure the Python server is running.",
                isBot: true
            }]);
        } finally {
            setIsTyping(false);
        }
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
                                            ? "bg-card text-foreground rounded-tl-none border border-border prose prose-sm max-w-none dark:prose-invert"
                                            : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20"
                                    )}>
                                        {msg.isBot ? (
                                            <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
                                                <ReactMarkdown>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
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
