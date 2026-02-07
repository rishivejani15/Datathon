import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Area, Scatter
} from 'recharts';
import {
    Filter,
    Cpu,
    GitBranch,
    Calendar,
    Users,
    AlertCircle,
    ArrowRight,
    Play,
    Loader2,
    CheckCircle2,
    Github
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Mock Data ---

const predictabilityData = [
    { sprint: 'S20', planned: 120, completed: 115, predictability: 95 },
    { sprint: 'S21', planned: 130, completed: 110, predictability: 84 },
    { sprint: 'S22', planned: 125, completed: 122, predictability: 98 },
    { sprint: 'S23', planned: 140, completed: 115, predictability: 82 },
    { sprint: 'S24', planned: 135, completed: 130, predictability: 96 },
    { sprint: 'S25', planned: 145, completed: 142, predictability: 98 },
];

const deploymentData = [
    { week: 'W1', deployments: 12, failureRate: 5 },
    { week: 'W2', deployments: 15, failureRate: 2 },
    { week: 'W3', deployments: 8, failureRate: 0 },
    { week: 'W4', deployments: 18, failureRate: 8 },
    { week: 'W5', deployments: 22, failureRate: 4 },
];

const cycleTimeData = [
    { task: 'T-101', code: 2, review: 1, deploy: 0.5 },
    { task: 'T-102', code: 3, review: 2, deploy: 0.5 },
    { task: 'T-103', code: 1, review: 0.5, deploy: 0.2 },
    { task: 'T-104', code: 4, review: 3, deploy: 1 },
    { task: 'T-105', code: 2.5, review: 1.5, deploy: 0.5 },
];

const teamLoadData = [
    { name: 'Alice', active: 3, review: 2, waiting: 1 },
    { name: 'Bob', active: 4, review: 1, waiting: 0 },
    { name: 'Charlie', active: 2, review: 3, waiting: 2 },
    { name: 'Diana', active: 5, review: 0, waiting: 0 },
];

const Analytics = () => {
    // State for Simulator
    const [engineersToAdd, setEngineersToAdd] = useState(0);
    const [simulatedVelocity, setSimulatedVelocity] = useState(45); // Base velocity
    const [projectedCompletion, setProjectedCompletion] = useState(14); // Days

    const handleSimulationChange = (value) => {
        const added = value[0];
        setEngineersToAdd(added);
        // Simple mock simulation logic
        const newVelocity = 45 + (added * 8); // Diminishing returns could be added
        setSimulatedVelocity(newVelocity);
        setProjectedCompletion(Math.round(14 * (45 / newVelocity)));
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Advanced Analytics</h2>
                <p className="text-muted-foreground">Deep dive simulation and predictive modeling for engineering operations.</p>
            </motion.div>

            {/* Interactive Filters Bar */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filters:</span>
                </div>
                {['All Teams', 'Alpha Squad', 'Beta Squad'].map(t => (
                    <button key={t} className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent/50 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
                        {t}
                    </button>
                ))}
                <div className="h-4 w-px bg-border" />
                {['Last 6 Sprints', 'Q3 2024', 'YTD'].map(t => (
                    <button key={t} className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent/50 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
                        {t}
                    </button>
                ))}
            </motion.div>

            {/* Live Repository Insights */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Github className="h-4 w-4" />
                                Live Repo Stats
                            </CardTitle>
                            {fetchingCommits ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Repository</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg font-bold">{userData?.githubId || "..."}</span>
                                    <span className="text-muted-foreground">/</span>
                                    <input
                                        value={repoName}
                                        onChange={(e) => setRepoName(e.target.value)}
                                        className="bg-transparent border-b border-border/50 focus:border-primary outline-none font-bold text-lg w-32"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Commits</p>
                                    <p className="text-2xl font-black mt-1">{commitData?.count || "0"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Authors</p>
                                    <p className="text-2xl font-black mt-1">
                                        {commitData?.commits ? new Set(commitData.commits.map(c => c.commit?.author?.name)).size : "0"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">Recent Live Commits</CardTitle>
                        <CardDescription>Real-time stream from {repoName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[120px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                            {fetchingCommits ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                                    Fetching live data...
                                </div>
                            ) : commitData?.commits?.length > 0 ? (
                                commitData.commits.slice(0, 5).map((commit, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                {commit.commit?.author?.name?.charAt(0) || "G"}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className="text-xs font-bold truncate">{commit.commit?.message}</span>
                                                <span className="text-[10px] text-muted-foreground">{commit.commit?.author?.name} • {new Date(commit.commit?.author?.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                                            {commit.sha?.substring(0, 7)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4">
                                    <AlertCircle className="h-4 w-4 mb-2 opacity-20" />
                                    No live commits found for this organization.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
                {/* Sprint Predictability */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sprint Predictability</CardTitle>
                        <CardDescription>Planned vs Completed Story Points (Target: 85-110%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={predictabilityData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis dataKey="sprint" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="planned" name="Planned" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="predictability" name="Predictability %" stroke="hsl(var(--accent))" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Deployment Frequency vs Failure */}
                <Card>
                    <CardHeader>
                        <CardTitle>DORA Metrics: Speed vs Stability</CardTitle>
                        <CardDescription>Deployment Frequency (Bars) vs Change Failure Rate (Line)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={deploymentData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="deployments" name="Deployments" fill="hsl(var(--emerald-500))" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="failureRate" name="Failure Rate %" stroke="hsl(var(--destructive))" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
                {/* Simulator Widget */}
                <Card className="col-span-1 border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500">
                                <Cpu className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-indigo-500">Resource Simulator</CardTitle>
                                <CardDescription>Impact of adding engineers</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">Additional Engineers</span>
                                <span className="font-bold text-indigo-500">+{engineersToAdd}</span>
                            </div>
                            <Slider
                                defaultValue={[0]}
                                max={5}
                                step={1}
                                onValueChange={handleSimulationChange}
                                className="py-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500/10">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Proj. Velocity</p>
                                <p className="text-2xl font-bold">{simulatedVelocity} <span className="text-xs font-normal text-muted-foreground">pts</span></p>
                                <p className="text-[10px] text-emerald-500">+{Math.round(((simulatedVelocity - 45) / 45) * 100)}% increase</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Est. Completion</p>
                                <p className="text-2xl font-bold">{projectedCompletion} <span className="text-xs font-normal text-muted-foreground">days</span></p>
                                <p className="text-[10px] text-emerald-500">Save {14 - projectedCompletion} days</p>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-background/50 border border-indigo-500/10 text-xs text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-indigo-500 mt-0.5" />
                                <p>Adding more than 3 engineers may trigger diminishing returns due to onboarding overhead.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cycle Time Breakdown */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Cycle Time Breakdown</CardTitle>
                        <CardDescription>Time spent in Code, Review, and Deploy stages (Last 5 tasks).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={cycleTimeData} layout="vertical" barSize={15}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/20" />
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="d" />
                                <YAxis dataKey="task" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={60} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="code" name="Coding" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]} />
                                <Bar dataKey="review" name="Review" stackId="a" fill="hsl(var(--accent))" />
                                <Bar dataKey="deploy" name="Deploy" stackId="a" fill="hsl(var(--emerald-500))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bottleneck Detection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Bottleneck Detection Radar</CardTitle>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                            <AlertCircle className="h-3 w-3" />
                            <span>Critical Bottleneck: Code Review</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Team Load Distribution</h4>
                            <div className="space-y-3">
                                {teamLoadData.map(member => (
                                    <div key={member.name} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>{member.name}</span>
                                            <span className="text-muted-foreground">{member.active + member.review} items</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                            <div style={{ width: `${(member.active / 8) * 100}%` }} className="bg-primary" title="Active" />
                                            <div style={{ width: `${(member.review / 8) * 100}%` }} className="bg-amber-500" title="Review" />
                                            <div style={{ width: `${(member.waiting / 8) * 100}%` }} className="bg-destructive" title="Waiting" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 p-4 rounded-xl bg-accent/20 border border-border">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Play className="h-4 w-4 text-primary" />
                                AI Insight: Process Optimization
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Code Review phase is adding <span className="text-foreground font-semibold">1.8 days</span> to average cycle time.
                                40% of PRs are waiting on <span className="text-foreground font-semibold">Alice</span> and <span className="text-foreground font-semibold">Bob</span>.
                                <br /><br />
                                <strong>Recommendation:</strong> Implement a round-robin reviewer assignment or allocate Code Review hours to distribute load evenly.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                                    Auto-assign Reviewers
                                </button>
                                <button className="text-xs bg-background border border-border px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
                                    View PR Queue
                                </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default Analytics;
