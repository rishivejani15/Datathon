import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import {
    TrendingUp,
    Users,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import JiraMetrics from '../components/JiraMetrics';

const data = [
    { name: 'Jan', delivery: 85, cost: 78 },
    { name: 'Feb', delivery: 88, cost: 82 },
    { name: 'Mar', delivery: 92, cost: 80 },
    { name: 'Apr', delivery: 90, cost: 85 },
    { name: 'May', delivery: 95, cost: 88 },
    { name: 'Jun', delivery: 98, cost: 92 },
];

const utilizationData = [
    { name: 'Team A', active: 85, idle: 15 },
    { name: 'Team B', active: 92, idle: 8 },
    { name: 'Team C', active: 78, idle: 22 },
    { name: 'Team D', active: 88, idle: 12 },
];

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';

import { Tooltip as RechartsTooltip } from 'recharts';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip"
import { Sparkles, Brain, Info } from 'lucide-react';

import { AIInsightBadge } from '../components/AIInsight';

const RiskHeatmap = () => {
    const risks = [
        { area: 'Backend', risk: 'High', score: 85, insight: 'High innovative churn in auth-service.' },
        { area: 'Frontend', risk: 'Low', score: 25, insight: 'Stable delivery pace.' },
        { area: 'DevOps', risk: 'Medium', score: 60, insight: 'Deployment frequency dropped by 15%.' },
        { area: 'QA', risk: 'Low', score: 30, insight: 'Test coverage meets targets.' },
    ];

    return (
        <div className="grid grid-cols-2 gap-2 mt-4">
            {risks.map((r) => (
                <div key={r.area} className={cn(
                    "p-3 rounded-lg border flex flex-col justify-between h-24 hover:scale-[1.02] transition-transform cursor-default",
                    r.risk === 'High' ? "bg-red-500/10 border-red-500/20" :
                        r.risk === 'Medium' ? "bg-amber-500/10 border-amber-500/20" :
                            "bg-emerald-500/10 border-emerald-500/20"
                )}>
                    <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{r.area}</span>
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase",
                            r.risk === 'High' ? "bg-red-500/20 text-red-500" :
                                r.risk === 'Medium' ? "bg-amber-500/20 text-amber-500" :
                                    "bg-emerald-500/20 text-emerald-500"
                        )}>{r.risk}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.insight}</p>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const { jiraData } = useAuth();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Executive Dashboard</h2>
                <p className="text-muted-foreground">AI-driven insights into engineering health, productivity, and delivery risks.</p>
            </motion.div>

            {/* Key Metrics */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Health Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.2</div>
                        <p className="text-xs text-muted-foreground mb-2">+2.1% from last month</p>
                        <AIInsightBadge insight="Delivery consistency improved due to reduced scope creep in Sprint 24. Backend team velocity stabilized." />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Productivity Index</CardTitle>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">124.5</div>
                        <p className="text-xs text-muted-foreground mb-2">Org-wide output metric</p>
                        <AIInsightBadge insight="High impact contributions detected in Alpha Squad. Code review turnaround time decreased by 18%." />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Cycle Time</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.2 Days</div>
                        <p className="text-xs text-muted-foreground mb-2">-0.4 days from average</p>
                        <AIInsightBadge insight="Bottleneck identified in QA stage. Automated testing adoption has reduced regression cycle by 1.5 days." />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">High</div>
                        <p className="text-xs text-muted-foreground mb-2">1 Project Critical</p>
                        <AIInsightBadge insight="⚠️ Delivery risk increased 18% due to backend team overload in Sprint 24. Recommend reallocation of 2 senior engineers." />
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Cost vs Output Efficiency */}
                <Card className="col-span-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Cost vs Output Efficiency</CardTitle>
                                <CardDescription>
                                    Tracking delivery value against operational expenditure (90 Days).
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Efficiency +12%</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="delivery"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                    name="Output Value"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={3}
                                    name="Operational Cost"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Risk Heatmap & Utilization */}
                <Card className="col-span-3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Risk Heatmap</CardTitle>
                        <CardDescription>
                            Real-time risk assessment across engineering domains.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <RiskHeatmap />
                        <div className="mt-8">
                            <h4 className="text-sm font-medium mb-4">Resource Utilization Trend</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={utilizationData} layout="vertical" barSize={12}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/20" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        width={70}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="active"
                                        name="Active"
                                        fill="hsl(var(--primary))"
                                        stackId="a"
                                        radius={[0, 4, 4, 0]}
                                    />
                                    <Bar
                                        dataKey="idle"
                                        name="Idle"
                                        fill="hsl(var(--muted))"
                                        stackId="a"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Existing Bottom Cards... keeping them as they provide good context */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent AI Alerts</CardTitle>
                        <CardDescription>System generated anomalies.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { title: 'Velocity Drop', desc: 'Beta Squad velocity dropped by 15% vs running average.', time: '2h ago', level: 'warn' },
                                { title: 'Cost Spike', desc: 'Cloud compute costs exceeded budget variance in us-east.', time: '5h ago', level: 'high' },
                                { title: 'Pattern Matched', desc: 'Deployment success rate matches Q3 high-performance baseline.', time: '1d ago', level: 'good' }
                            ].map((i, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
                                    <div className="mt-1">
                                        {i.level === 'good' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                                            i.level === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                                                <AlertTriangle className="h-4 w-4 text-destructive" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{i.title}</p>
                                        <p className="text-xs text-muted-foreground">{i.desc}</p>
                                        <p className="text-[10px] text-muted-foreground pt-1">{i.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Strategic Initiatives Status</CardTitle>
                        <CardDescription>Progress on OKRs and major milestones.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {['Migration to Cloud', 'AI Model Training', 'Frontend Revamp', 'Mobile App V2'].map((project, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg border-border/50 hover:border-primary/20 transition-all hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-2 w-2 rounded-full", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-amber-500" : "bg-primary")} />
                                        <div>
                                            <p className="font-medium">{project}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-muted-foreground">Target: Q4 2024</p>
                                                {i === 1 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">Risk Detected</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{75 - (i * 10)}%</p>
                                            <p className="text-xs text-muted-foreground">Progress</p>
                                        </div>
                                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full", i === 1 ? "bg-amber-500" : "bg-primary")}
                                                style={{ width: `${75 - (i * 10)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Jira Health Section */}
            {jiraData && jiraData.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#0052CC]" />
                        Jira Health
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <JiraMetrics jiraData={jiraData} />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Dashboard;
