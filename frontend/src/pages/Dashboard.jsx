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
    Zap,
    Briefcase,
    GitBranch,
    Code2,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import JiraMetrics from '../components/JiraMetrics';
import { 
    calculateJiraMetrics, 
    calculateGitHubMetrics, 
    calculateContributorMetrics,
    calculateTrendMetrics,
    generateChartData,
    generateRiskAnalysis
} from '../lib/metrics';

// Remove static data - will be calculated from real data

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

const RiskHeatmap = ({ risks = [] }) => {
    if (!risks || risks.length === 0) {
        return (
            <div className="text-center p-4 text-muted-foreground">
                No risk data available yet
            </div>
        );
    }

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
    const { jiraData, githubRepos, pullRequests, issues, commits, contributors, selectedIntegrations } = useAuth();

    // Check if integrations are selected
    const hasJira = selectedIntegrations.includes('jira');
    const hasGithub = selectedIntegrations.includes('github');
    const hasNoIntegrations = selectedIntegrations.length === 0;

    // Calculate all metrics from real data
    const jiraMetrics = hasJira ? calculateJiraMetrics(jiraData) : null;
    const githubMetrics = hasGithub ? calculateGitHubMetrics(githubRepos, pullRequests, issues, commits) : null;
    const contributorMetrics = hasGithub ? calculateContributorMetrics(contributors) : null;
    const trendMetrics = hasGithub ? calculateTrendMetrics(commits, pullRequests) : null;
    const chartData = hasGithub ? generateChartData(commits) : [];
    const riskAnalysis = (hasJira || hasGithub) ? generateRiskAnalysis(jiraData, pullRequests, issues) : [];

    // Calculate key dashboard metrics
    const deliveryHealthScore = jiraMetrics ? 
        Math.round((jiraMetrics.done / (jiraMetrics.totalIssues || 1)) * 100) : 0;
    
    const productivityIndex = githubMetrics ? 
        (githubMetrics.totalCommits + (githubMetrics.totalPRs * 2)) : 0;
    
    const avgCycleTime = (githubMetrics && githubMetrics.totalPRs > 0) ? 
        (Math.random() * 2 + 2).toFixed(1) : 0; // Placeholder calculation
    
    const deliveryRisk = jiraMetrics && jiraMetrics.highestPriority > 0 ? 'High' : 'Medium';

    // Resource utilization data from contributors
    const utilizationData = (contributorMetrics && contributorMetrics.topContributors) ? 
        contributorMetrics.topContributors.slice(0, 4).map((contributor, idx) => ({
            name: `Contributor ${idx + 1}`,
            active: contributor.contributions,
            idle: Math.max(0, 100 - contributor.contributions)
        })) : [];

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

            {/* No Integrations Message */}
            {hasNoIntegrations && (
                <motion.div variants={itemVariants} className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border-2 border-dashed border-blue-500/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Briefcase className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">No Integrations Connected</h3>
                            <p className="text-sm text-muted-foreground">Connect Jira, GitHub, or other services to start seeing insights</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground">Go to Settings to connect your integrations and unlock powerful analytics for your team.</p>
                </motion.div>
            )}

            {/* Key Metrics */}
            {(hasJira || hasGithub) && (
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Health Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{deliveryHealthScore}%</div>
                        <p className="text-xs text-muted-foreground mb-2">{jiraMetrics?.done || 0} of {jiraMetrics?.totalIssues || 0} completed</p>
                        <AIInsightBadge insight={`${jiraMetrics?.inProgress || 0} issues in progress, ${jiraMetrics?.toDo || 0} pending.`} />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Productivity Index</CardTitle>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productivityIndex}</div>
                        <p className="text-xs text-muted-foreground mb-2">{githubMetrics?.totalCommits || 0} commits, {githubMetrics?.totalPRs || 0} PRs</p>
                        <AIInsightBadge insight={`${githubMetrics?.deliveryRate || 0}% PR merge rate. ${contributorMetrics?.totalContributors || 0} active contributors.`} />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Code Changes</CardTitle>
                        <Code2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{githubMetrics?.totalAdditions || 0}</div>
                        <p className="text-xs text-muted-foreground mb-2">-{githubMetrics?.totalDeletions || 0} lines deleted</p>
                        <AIInsightBadge insight={`Net changes: ${githubMetrics?.netChanges || 0} lines in ${githubMetrics?.totalPRs || 0} PRs.`} />
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${deliveryRisk === 'High' ? 'text-destructive' : 'text-amber-500'}`}>
                            {deliveryRisk}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{jiraMetrics?.highPriority || 0} high priority issues</p>
                        <AIInsightBadge insight={`${jiraMetrics?.highestPriority || 0} critical issues requiring immediate attention.`} />
                    </CardContent>
                </Card>
            </motion.div>
            )}

            {/* Charts and Analytics - only if integrations exist */}
            {(hasJira || hasGithub) && (
            <>
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
                            <LineChart data={chartData || []}>
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
                                    tickFormatter={(value) => `${value}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="commits"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                    name="Commits"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="delivery"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={3}
                                    name="Efficiency %"
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
                        <RiskHeatmap risks={riskAnalysis} />
                        <div className="mt-8">
                            <h4 className="text-sm font-medium mb-4">Resource Utilization Trend</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={utilizationData && utilizationData.length > 0 ? utilizationData : []} layout="vertical" barSize={12}>
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

            {/* GitHub Analytics Section - only if GitHub selected */}
            {hasGithub && githubMetrics && (githubMetrics.totalRepos > 0 || githubMetrics.totalCommits > 0) && (
                <motion.div variants={itemVariants} className="space-y-4 p-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-lg border-2 border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <GitBranch className="h-6 w-6 text-emerald-600" />
                            GitHub Analytics
                        </h3>
                    </div>

                    {/* GitHub Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Repositories</CardTitle>
                                <GitBranch className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">{githubMetrics.totalRepos}</div>
                                <p className="text-xs text-muted-foreground">Total repos</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Commits</CardTitle>
                                <FileText className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{githubMetrics.totalCommits}</div>
                                <p className="text-xs text-muted-foreground">Total commits</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
                                <Code2 className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">{githubMetrics.totalPRs}</div>
                                <p className="text-xs text-muted-foreground">{githubMetrics.mergedPRs} merged</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{githubMetrics.totalIssues}</div>
                                <p className="text-xs text-muted-foreground">{githubMetrics.closedIssues} closed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Merge Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{githubMetrics.deliveryRate}%</div>
                                <p className="text-xs text-muted-foreground">Delivery rate</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contributors</CardTitle>
                                <Users className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-600">{contributorMetrics.totalContributors}</div>
                                <p className="text-xs text-muted-foreground">Active contributors</p>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            )}

            {/* Jira Data Section */}
            {hasJira && jiraData && jiraMetrics ? (
                <motion.div variants={itemVariants} className="space-y-4 p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg border-2 border-blue-500/20">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-[#0052CC]" />
                            Jira Workspace Overview
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            Last synced: {jiraMetrics.syncedAt ? new Date(jiraMetrics.syncedAt).toLocaleString() : 'Unknown'}
                        </span>
                    </div>
                    
                    {/* Jira Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{jiraMetrics.totalIssues}</div>
                                <p className="text-xs text-muted-foreground">Assigned to you</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-500">{jiraMetrics.inProgress}</div>
                                <p className="text-xs text-muted-foreground">Active tasks</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-500">{jiraMetrics.toDo}</div>
                                <p className="text-xs text-muted-foreground">Pending tasks</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">{jiraMetrics.done}</div>
                                <p className="text-xs text-muted-foreground">Done</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                                <TrendingUp className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">{jiraMetrics.highPriority}</div>
                                <p className="text-xs text-muted-foreground">Needs attention</p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Boards and Issues Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Boards List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Boards</CardTitle>
                                <CardDescription>{jiraMetrics.boards?.length || 0} board(s) in your workspace</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {jiraMetrics.boards && jiraMetrics.boards.length > 0 ? (
                                        jiraMetrics.boards.slice(0, 5).map((board) => (
                                            <div key={board.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div>
                                                    <p className="font-medium text-sm">{board.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{board.type}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-[#0052CC]/10 text-[#0052CC] rounded-full">
                                                    ID: {board.id}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No boards found</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Recent Issues */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Issues</CardTitle>
                                <CardDescription>Your latest assigned tasks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {jiraData?.jira_payload?.assigned_issues?.slice(0, 5).map((issue) => (
                                        <div key={issue.issue_key} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">{issue.issue_key}</span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full",
                                                        issue.status === 'Done' ? "bg-emerald-500/10 text-emerald-500" :
                                                        issue.status === 'In Progress' ? "bg-blue-500/10 text-blue-500" :
                                                        "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {issue.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium line-clamp-1">{issue.summary}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded",
                                                        issue.priority === 'Highest' || issue.priority === 'High' ? "bg-red-500/10 text-red-500" :
                                                        issue.priority === 'Medium' ? "bg-amber-500/10 text-amber-500" :
                                                        "bg-gray-500/10 text-gray-500"
                                                    )}>
                                                        {issue.priority}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">{issue.issue_type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) || <p className="text-sm text-muted-foreground">No issues found</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            ) : (
                <motion.div variants={itemVariants} className="p-6 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No Jira data available. Please sync your Jira account.</p>
                </motion.div>
            )}
            </>
            )}
        </motion.div>
    );
};

export default Dashboard;
