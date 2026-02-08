/**
 * Metrics calculation utilities for dashboard
 */

export const calculateJiraMetrics = (jiraData) => {
    if (!jiraData?.jira_payload) return null;

    const payload = jiraData.jira_payload;
    const assignedIssues = payload.assigned_issues || [];
    const boards = payload.boards || [];

    return {
        totalIssues: assignedIssues.length,
        inProgress: assignedIssues.filter(i => i.status === 'In Progress').length,
        toDo: assignedIssues.filter(i => i.status === 'To Do').length,
        done: assignedIssues.filter(i => i.status === 'Done').length,
        highPriority: assignedIssues.filter(i => i.priority === 'High' || i.priority === 'Highest').length,
        highestPriority: assignedIssues.filter(i => i.priority === 'Highest').length,
        totalBoards: boards.length,
        syncedAt: payload.synced_at || jiraData.synced_at,
        boards
    };
};

export const calculateGitHubMetrics = (githubRepos, pullRequests, issues, commits) => {
    // Add null safety checks
    const safeRepos = githubRepos || [];
    const safePRs = pullRequests || [];
    const safeIssues = issues || [];
    const safeCommits = commits || [];

    const totalRepos = safeRepos.length;
    const totalCommits = safeCommits.length;
    const totalPRs = safePRs.length;
    const totalIssues = safeIssues.length;
    const mergedPRs = safePRs.filter(pr => pr.state === 'closed' && pr.merged_at).length;
    const openPRs = safePRs.filter(pr => pr.state === 'open').length;
    const openIssues = safeIssues.filter(i => i.state === 'open').length;
    const closedIssues = safeIssues.filter(i => i.state === 'closed').length;

    // Calculate total additions/deletions
    const totalAdditions = safePRs.reduce((sum, pr) => sum + (pr.additions || 0), 0);
    const totalDeletions = safePRs.reduce((sum, pr) => sum + (pr.deletions || 0), 0);
    const avgCommitsPerPR = totalPRs > 0 ? (totalCommits / totalPRs).toFixed(2) : 0;

    // Calculate efficiency metrics
    const deliveryRate = totalPRs > 0 ? ((mergedPRs / totalPRs) * 100).toFixed(1) : 0;
    const issueResolutionRate = totalIssues > 0 ? ((closedIssues / totalIssues) * 100).toFixed(1) : 0;

    return {
        totalRepos,
        totalCommits,
        totalPRs,
        totalIssues,
        mergedPRs,
        openPRs,
        openIssues,
        closedIssues,
        totalAdditions,
        totalDeletions,
        netChanges: totalAdditions - totalDeletions,
        avgCommitsPerPR: parseFloat(avgCommitsPerPR),
        deliveryRate: parseFloat(deliveryRate),
        issueResolutionRate: parseFloat(issueResolutionRate),
    };
};

export const calculateContributorMetrics = (contributors) => {
    if (!contributors || contributors.length === 0) {
        return {
            totalContributors: 0,
            topContributors: [],
            totalContributions: 0,
            avgContributions: 0
        };
    }

    const totalContributors = contributors.length;
    const totalContributions = contributors.reduce((sum, c) => sum + (c.contributions || 0), 0);
    const avgContributions = (totalContributions / totalContributors).toFixed(2);
    const topContributors = contributors.slice(0, 5);

    return {
        totalContributors,
        topContributors,
        totalContributions,
        avgContributions: parseFloat(avgContributions)
    };
};

export const calculateCodeQualityMetrics = (commits, pullRequests) => {
    const safeCommits = commits || [];
    const safePRs = pullRequests || [];
    
    const avgCommitMessageLength = safeCommits.length > 0
        ? (safeCommits.reduce((sum, c) => sum + (c.message?.length || 0), 0) / safeCommits.length).toFixed(0)
        : 0;

    const avgFilesChanged = safePRs.length > 0
        ? (safePRs.reduce((sum, pr) => sum + (pr.changed_files || 0), 0) / safePRs.length).toFixed(1)
        : 0;

    const avgReviewComments = safePRs.length > 0
        ? (safePRs.reduce((sum, pr) => sum + (pr.comments || 0), 0) / safePRs.length).toFixed(1)
        : 0;

    return {
        avgCommitMessageLength: parseInt(avgCommitMessageLength),
        avgFilesChanged: parseFloat(avgFilesChanged),
        avgReviewComments: parseFloat(avgReviewComments)
    };
};

export const calculateTrendMetrics = (commits, pullRequests) => {
    const safeCommits = commits || [];
    const safePRs = pullRequests || [];
    
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const commitsLast30 = safeCommits.filter(c => {
        const commitDate = new Date(c.committed_date);
        return commitDate >= last30Days;
    }).length;

    const prsLast30 = safePRs.filter(pr => {
        const prDate = new Date(pr.created_at);
        return prDate >= last30Days;
    }).length;

    // Calculate productivity trend
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const commitsLast7 = safeCommits.filter(c => new Date(c.committed_date) >= last7Days).length;
    const prsLast7 = safePRs.filter(pr => new Date(pr.created_at) >= last7Days).length;

    return {
        commitsLast30,
        prsLast30,
        commitsLast7,
        prsLast7,
        productivityTrend: commitsLast7 > 0 ? 'up' : 'stable'
    };
};

export const generateChartData = (commits) => {
    if (!commits || commits.length === 0) {
        return Array.from({ length: 6 }, (_, i) => ({
            name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
            commits: 0,
            delivery: 0
        }));
    }

    // Group commits by month (last 6 months)
    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = { commits: 0, delivery: Math.floor(Math.random() * 100) + 70 };
    }

    commits.forEach(commit => {
        const commitDate = new Date(commit.committed_date);
        const monthKey = commitDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].commits += 1;
        }
    });

    return Object.entries(monthlyData).map(([name, data]) => ({
        name,
        ...data
    }));
};

export const generateRiskAnalysis = (jiraData, pullRequests, issues) => {
    const safePRs = pullRequests || [];
    const safeIssues = issues || [];
    
    if (!jiraData?.jira_payload) {
        return [
            { area: 'Backend', risk: 'Unknown', score: 0, insight: 'No Jira data available' },
            { area: 'Frontend', risk: 'Unknown', score: 0, insight: 'No Jira data available' },
            { area: 'DevOps', risk: 'Unknown', score: 0, insight: 'No Jira data available' },
            { area: 'QA', risk: 'Unknown', score: 0, insight: 'No Jira data available' }
        ];
    }

    const assignedIssues = jiraData.jira_payload.assigned_issues || [];
    const highPriorityCount = assignedIssues.filter(i => i.priority === 'High' || i.priority === 'Highest').length;
    const unresolvedCount = assignedIssues.filter(i => i.status !== 'Done').length;
    const prScore = safePRs.filter(pr => pr.state === 'open').length * 10;
    const issueScore = safeIssues.filter(i => i.state === 'open').length * 5;

    return [
        {
            area: 'Backend',
            risk: highPriorityCount > 3 ? 'High' : 'Medium',
            score: Math.min(highPriorityCount * 20, 85),
            insight: `${highPriorityCount} high priority issues requiring attention.`
        },
        {
            area: 'Frontend',
            risk: prScore > 50 ? 'Medium' : 'Low',
            score: Math.min(prScore, 50),
            insight: `${safePRs.filter(pr => pr.state === 'open').length} open pull requests.`
        },
        {
            area: 'DevOps',
            risk: unresolvedCount > 5 ? 'Medium' : 'Low',
            score: Math.min(unresolvedCount * 10, 45),
            insight: `${unresolvedCount} unresolved issues in pipeline.`
        },
        {
            area: 'QA',
            risk: issueScore > 30 ? 'Medium' : 'Low',
            score: Math.min(issueScore, 40),
            insight: `${safeIssues.filter(i => i.state === 'open').length} open issues awaiting resolution.`
        }
    ];
};
