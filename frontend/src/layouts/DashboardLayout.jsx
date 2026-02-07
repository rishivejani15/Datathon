import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    Menu,
    X,
    Bell,
    Search,
    LogOut,
    Bot,
    TrendingUp,
    DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { searchIndex } from '../lib/searchData';
import ChatBot from '../components/ChatBot';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', to: '/' },
        { icon: TrendingUp, label: 'Analytics', to: '/analytics' },
        { icon: DollarSign, label: 'Finance', to: '/finance' },
        { icon: Users, label: 'Workforce', to: '/workforce' },
        { icon: Briefcase, label: 'Delivery', to: '/delivery' },
        { icon: Settings, label: 'Settings', to: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Component */}
            <motion.aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 border-r border-border/50 bg-background/60 backdrop-blur-xl transition-transform md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center border-b border-border/50 px-6">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </div>
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">EntelliGen</span>
                    </div>
                    <button onClick={toggleSidebar} className="ml-auto md:hidden">
                        <X className="h-6 w-6 text-muted-foreground" />
                    </button>
                </div>

                <nav className="flex flex-col gap-2 p-4">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Platform
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-primary/10 rounded-lg"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("h-4 w-4 relative z-10", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors")} />
                                    <span className="relative z-10">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-semibold text-foreground truncate">{currentUser?.email || 'User'}</span>
                                <span className="text-[10px] text-muted-foreground">Engineering Lead</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

const Topbar = ({ toggleSidebar }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 0) {
            const filtered = searchIndex.filter(item =>
                item.title.toLowerCase().includes(value.toLowerCase()) ||
                item.type.toLowerCase().includes(value.toLowerCase())
            );
            setResults(filtered);
            setShowResults(true);
        } else {
            setResults([]);
            setShowResults(false);
        }
    };

    const handleResultClick = (url) => {
        navigate(url);
        setQuery('');
        setShowResults(false);
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="md:hidden">
                    <Menu className="h-6 w-6 text-muted-foreground" />
                </button>
                <h1 className="hidden text-lg font-semibold md:block text-foreground">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search projects, teams, metrics..."
                        value={query}
                        onChange={handleSearch}
                        onFocus={() => query.length > 0 && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        className="h-10 w-96 rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                    />

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {showResults && results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full mt-2 w-96 rounded-xl border border-border bg-card shadow-lg ring-1 ring-black/5 overflow-hidden"
                            >
                                <div className="py-2">
                                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                                        Results
                                    </div>
                                    {results.map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result.url)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-colors text-left"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                {result.icon ? <result.icon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{result.title}</span>
                                                {result.description && (
                                                    <span className="text-xs text-muted-foreground">{result.description}</span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{result.type}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <button className="relative rounded-full p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
                </button>
            </div>
        </header>
    );
};

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
                <ChatBot />
            </div>
        </div>
    );
};

export default DashboardLayout;
