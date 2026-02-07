import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip"
import { Sparkles, Brain } from 'lucide-react';

const AIInsight = ({ insight, type = "default" }) => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className="cursor-help inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors border border-indigo-500/20">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-[10px] font-medium">AI Insight</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-900 border-indigo-500/30 text-slate-50 p-4 shadow-xl">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                            <Brain className="h-4 w-4" />
                            <span>Analysis</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">{insight}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export const AIInsightBadge = AIInsight;

export default AIInsight;
