import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Briefcase, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const COLORS = ['#0052CC', '#36B37E', '#FF5630', '#FFAB00', '#6554C0'];

const JiraMetrics = ({ jiraData }) => {
    if (!jiraData || jiraData.length === 0) {
        return (
            <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="p-4 bg-[#0052CC]/10 border border-[#0052CC]/20 rounded-2xl">
                        <Briefcase className="h-12 w-12 text-[#0052CC]" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold">No Jira Data Available</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Connect your Jira workspace to unlock AI-driven insights on your project health, sprint velocity, and team performance.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Aggregate metrics from jiraData
    const totalTickets = jiraData.length;
    const openTickets = jiraData.filter(item => item.status?.toLowerCase() === 'open' || item.status?.toLowerCase() === 'in progress').length;
    const closedTickets = jiraData.filter(item => item.status?.toLowerCase() === 'done' || item.status?.toLowerCase() === 'closed').length;
    const highPriorityTickets = jiraData.filter(item => item.priority?.toLowerCase() === 'high' || item.priority?.toLowerCase() === 'critical').length;

    // Status breakdown for pie chart
    const statusCounts = jiraData.reduce((acc, item) => {
        const status = item.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Priority distribution for bar chart
    const priorityCounts = jiraData.reduce((acc, item) => {
        const priority = item.priority || 'None';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    const priorityData = Object.entries(priorityCounts).map(([name, count]) => ({ name, count }));

    return (
        <>
            {/* Metrics Cards */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTickets}</div>
                    <p className="text-xs text-muted-foreground">Across all projects</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{openTickets}</div>
                    <p className="text-xs text-muted-foreground">
                        {totalTickets > 0 ? `${Math.round((openTickets / totalTickets) * 100)}% of total` : 'N/A'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closed Tickets</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{closedTickets}</div>
                    <p className="text-xs text-muted-foreground">
                        {totalTickets > 0 ? `${Math.round((closedTickets / totalTickets) * 100)}% completion` : 'N/A'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{highPriorityTickets}</div>
                    <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card className="col-span-full md:col-span-2">
                <CardHeader>
                    <CardTitle>Ticket Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Priority Distribution Chart */}
            <Card className="col-span-full md:col-span-2">
                <CardHeader>
                    <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priorityData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#0052CC" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
    );
};

export default JiraMetrics;
