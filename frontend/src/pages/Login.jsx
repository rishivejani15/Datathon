import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chrome, ArrowRight, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
    }

    async function handleGoogleSignIn() {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Failed to sign in with Google.');
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex flex-col relative bg-zinc-900 text-white p-12 overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10 flex items-center gap-2 mb-20">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <LayoutDashboard className="h-6 w-6 text-indigo-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">EntelliGen</span>
                </div>

                <div className="relative z-10 my-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                    >
                        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                            Transform Engineering <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                Into Intelligence.
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
                            Advanced analytics, predictive modeling, and workforce insights for high-performing engineering teams.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex flex-col gap-4"
                    >
                        {[
                            "Prevent burnout with AI-driven workload analysis",
                            "Predict sprint delivery with 95% accuracy",
                            "Optimize engineering costs and efficiency"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-zinc-300 font-medium">{feature}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="relative z-10 mt-auto">
                    <p className="text-xs text-zinc-500">© 2026 EntelliGen Inc. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm space-y-8"
                >
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 font-medium relative overflow-hidden group"
                        >
                            <Chrome className="h-4 w-4 text-foreground" />
                            <span>Sign in with Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                                    <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-primary"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/20"
                            >
                                {loading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="h-4 w-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
