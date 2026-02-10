import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    ArrowRight,
    BrainCircuit,
    MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../lib/animations';

const projects = [
    {
        name: 'Cloud Migration Phase 2',
        status: 'On Track',
        progress: 65,
        risk: 'Low',
        dueDate: 'Oct 24, 2024',
        insight: 'Velocity is stable. Estimated completion is 3 days ahead of schedule.'
    },
    {
        name: 'Auth Service Rewrite',
        status: 'At Risk',
        progress: 42,
        risk: 'High',
        dueDate: 'Nov 01, 2024',
        insight: 'Backend dependencies are causing bottlenecks. Suggest increasing allocation by 2 engineers.'
    },
    {
        name: 'Mobile App Redesign',
        status: 'Delayed',
        progress: 88,
        risk: 'Medium',
        dueDate: 'Sep 30, 2024',
        insight: 'QA cycle is taking longer than expected due to new animation regression.'
    },
    {
        name: 'Analytics Pipeline',
        status: 'On Track',
        progress: 25,
        risk: 'Low',
        dueDate: 'Dec 15, 2024',
        insight: 'Initial data ingestion successful. Model training scheduled for next sprint.'
    }
];

const Delivery = () => {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Delivery & Workflows</h2>
                <p className="text-muted-foreground">Real-time status of engineering initiatives with AI-driven risk analysis.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6">
                {projects.map((project, index) => (
                    <Card key={index} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center border-b border-border/50 bg-muted/20 p-4 gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{project.name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${project.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        project.status === 'At Risk' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Due: {project.dueDate}</span>
                                </div>
                                <div className="w-32">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Progress</span>
                                        <span>{project.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                                        <div
                                            className={`h-full rounded-full ${project.status === 'At Risk' ? 'bg-amber-500' :
                                                project.status === 'Delayed' ? 'bg-destructive' :
                                                    'bg-primary'
                                                }`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-background rounded-full transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <CardContent className="p-4 bg-card">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors">
                                <BrainCircuit className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-indigo-500">AI Insight</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {project.insight}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default Delivery;
