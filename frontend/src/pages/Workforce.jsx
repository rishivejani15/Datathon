import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import { Users, Zap, Award, Target } from 'lucide-react';

const teamPerformanceData = [
    { name: 'Alpha Squad', velocity: 45, quality: 98, satisfaction: 4.2 },
    { name: 'Beta Squad', velocity: 52, quality: 95, satisfaction: 4.5 },
    { name: 'Gamma Squad', velocity: 38, quality: 92, satisfaction: 3.8 },
    { name: 'Delta Squad', velocity: 48, quality: 96, satisfaction: 4.1 },
    { name: 'Epsilon Squad', velocity: 41, quality: 97, satisfaction: 4.3 },
];

const productivityScatterData = [
    { x: 10, y: 80, z: 200, name: 'Alice' },
    { x: 12, y: 85, z: 260, name: 'Bob' },
    { x: 15, y: 70, z: 400, name: 'Charlie' },
    { x: 8, y: 90, z: 280, name: 'David' },
    { x: 11, y: 75, z: 500, name: 'Eve' },
    { x: 14, y: 82, z: 300, name: 'Frank' },
    { x: 16, y: 88, z: 350, name: 'Grace' },
    { x: 9, y: 92, z: 220, name: 'Heidi' },
];

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';

const Workforce = () => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Workforce Intelligence</h2>
                <p className="text-muted-foreground">Deep dive into engineering team performance and individual contribution patterns.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Engineers</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">Across 12 squads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Velocity</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">44.8</div>
                        <p className="text-xs text-muted-foreground">Points per sprint</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                        <Award className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Beta Squad</div>
                        <p className="text-xs text-muted-foreground">Highest quality score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On-Boarding</CardTitle>
                        <Target className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">Engineers in ramp-up</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Squad Velocity & Quality</CardTitle>
                        <CardDescription>Average velocity (points) vs Code Quality Score.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={teamPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis dataKey="name" fontSize={12} stroke="#888888" tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="velocity" name="Velocity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="quality" name="Quality Score" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contribution Impact Analysis</CardTitle>
                        <CardDescription>Code volume (X) vs Impact Score (Y). Size represents tenure.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                                <XAxis type="number" dataKey="x" name="PRs Merged" unit=" PRs" stroke="#888888" tickLine={false} axisLine={false} />
                                <YAxis type="number" dataKey="y" name="Impact Score" unit=" pts" stroke="#888888" tickLine={false} axisLine={false} />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Tenure" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Scatter name="Engineers" data={productivityScatterData} fill="hsl(var(--primary))" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default Workforce;
