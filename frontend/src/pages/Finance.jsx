import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    PieChart,
    AlertOctagon,
    Target,
    Calendar,
    Download,
    Zap,
    Clock,
    Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AIInsightBadge } from '../components/AIInsight';

// --- Mock Data ---

const costPerSprintData = [
    { sprint: 'S20', cost: 45000, budget: 50000 },
    { sprint: 'S21', cost: 48000, budget: 50000 },
    { sprint: 'S22', cost: 52000, budget: 50000 },
    { sprint: 'S23', cost: 49000, budget: 50000 },
    { sprint: 'S24', cost: 55000, budget: 52000 },
    { sprint: 'S25', cost: 51000, budget: 52000 },
];

const costVsValueData = [
    { feature: 'Auth Rewrite', cost: 12000, value: 85, roi: 7.1 },
    { feature: 'Dashboard AI', cost: 25000, value: 95, roi: 3.8 },
    { feature: 'Legacy Cleanup', cost: 8000, value: 40, roi: 5.0 },
    { feature: 'Mobile App', cost: 45000, value: 90, roi: 2.0 },
    { feature: 'API Gateway', cost: 18000, value: 75, roi: 4.2 },
    { feature: 'Search V2', cost: 15000, value: 60, roi: 4.0 },
    { feature: 'Notif System', cost: 10000, value: 55, roi: 5.5 },
];

const budgetBurnData = [
    { month: 'Jan', actual: 120, budget: 150, forecast: 120 },
    { month: 'Feb', actual: 250, budget: 300, forecast: 250 },
    { month: 'Mar', actual: 390, budget: 450, forecast: 390 },
    { month: 'Apr', actual: 540, budget: 600, forecast: 550 },
    { month: 'May', actual: null, budget: 750, forecast: 710 },
    { month: 'Jun', actual: null, budget: 900, forecast: 880 },
];

const costPerFeatureData = [
    { name: 'Auth', cost: 15000 },
    { name: 'Dashboard', cost: 28000 },
    { name: 'Reports', cost: 12000 },
    { name: 'Admin', cost: 9000 },
    { name: 'API', cost: 22000 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl">
                <p className="font-medium text-sm mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-bold">
                            {entry.value.toLocaleString()} {entry.unit}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const Finance = () => {
    const [dateRange, setDateRange] = useState('This Quarter');

    const handleExport = () => {
        const headers = ["Sprint", "Cost", "Budget"];
        const rows = costPerSprintData.map(row => [row.sprint, row.cost, row.budget]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "finance_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header with Actions */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Finance & Cost Intelligence</h2>
                    <p className="text-muted-foreground">Optimize engineering spend, forecast budgets, and maximize ROI.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-2 text-sm shadow-sm hover:bg-accent cursor-pointer transition-colors">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{dateRange}</span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </motion.div>

            {/* KPI Cards - Standardized */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Sprint Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$50,000</div>
                        <p className="text-xs text-muted-foreground mb-2 text-emerald-500 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +2.5% from last quarter
                        </p>
                        <AIInsightBadge insight="Cost per sprint increased marginally due to new infrastructure setup for AI features." />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                        <PieChart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground mb-2">On track for Q3</p>
                        <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden mb-2">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: '92%' }} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proj. ROI</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2x</div>
                        <p className="text-xs text-muted-foreground mb-2">Top Initiative: Dashboard AI</p>
                        <AIInsightBadge insight="Dashboard AI features are delivering 40% more value than legacy report tools." />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">Cost Anomalies</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">None</div>
                        <p className="text-xs text-muted-foreground mb-2">Spending is stable</p>
                        <AIInsightBadge insight="No significant cost anomalies detected in the last 3 sprints. Budget adherence is strong." />
                    </CardContent>
                </Card>
            </motion.div>

            {/* AI Insights & ROI - High Density Grid */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
                {/* Cost Anomaly Detection */}
                <Card className="md:col-span-1 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertOctagon className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-base text-amber-700 dark:text-amber-500">AI Cost Insights</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3 p-3 bg-card/50 rounded-lg border border-border shadow-sm">
                            <div className="mt-1">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold">Sprint 22 Overage</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                    <span className="font-bold text-amber-600">4% budget overrun</span> detected.
                                    Root cause: Cloud infrastructure scaling for load tests.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-card/50 rounded-lg border border-border shadow-sm">
                            <div className="mt-1">
                                <TrendingDown className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold">Optimization Found</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                    "Legacy Cleanup" has low ROI ($8k cost). Reallocate resources to "API Gateway".
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ROI Analysis */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Cost vs Business Impact</CardTitle>
                        <CardDescription>Identifying high-leverage engineering initiatives.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis type="number" dataKey="cost" name="Cost" unit="$" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis type="number" dataKey="value" name="Value" unit="pts" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <ZAxis type="number" dataKey="roi" range={[100, 500]} name="ROI" />
                                <Tooltip content={<CustomTooltip />} />
                                <Scatter name="Initiatives" data={costVsValueData} fill="hsl(var(--primary))" shape="circle" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Main Charts - Split View */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                {/* Budget Burn Forecast */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Budget Burn Forecast</CardTitle>
                                <CardDescription>Cumulative spend tracking</CardDescription>
                            </div>
                            <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold border border-indigo-500/20 uppercase tracking-wide">
                                AI: On Budget
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={budgetBurnData}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="k" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorActual)" name="Actual Spend" />
                                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" name="AI Forecast" />
                                <Line type="step" dataKey="budget" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Budget Limit" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sprints & Features Cost */}
                <Card className="col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Cost per Sprint</CardTitle>
                        <CardDescription>Variance against budget</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={costPerSprintData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis dataKey="sprint" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="$" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="cost" name="Actual Cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                                <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default Finance;
