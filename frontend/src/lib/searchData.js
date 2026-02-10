import { LayoutDashboard, Users, Briefcase, Settings, FileText, AlertTriangle } from 'lucide-react';

export const searchIndex = [
    // Navigation
    { id: 'nav-1', title: 'Dashboard Overview', type: 'Navigation', url: '/', icon: LayoutDashboard },
    { id: 'nav-2', title: 'Workforce Intelligence', type: 'Navigation', url: '/workforce', icon: Users },
    { id: 'nav-3', title: 'Delivery Status', type: 'Navigation', url: '/delivery', icon: Briefcase },
    { id: 'nav-4', title: 'Settings', type: 'Navigation', url: '/settings', icon: Settings },

    // Metrics/Data
    { id: 'dat-1', title: 'Delivery Health', type: 'Metric', url: '/', description: 'Current score: 98.2%', icon: FileText },
    { id: 'dat-2', title: 'Active Engineers', type: 'Metric', url: '/', description: 'Total: 1,240', icon: Users },
    { id: 'dat-3', title: 'Alpha Squad', type: 'Team', url: '/workforce', description: 'Velocity: 45', icon: Users },
    { id: 'dat-4', title: 'Beta Squad', type: 'Team', url: '/workforce', description: 'Top Performer', icon: Users },

    // Projects
    { id: 'proj-1', title: 'Cloud Migration Phase 2', type: 'Project', url: '/delivery', description: 'Status: On Track', icon: Briefcase },
    { id: 'proj-2', title: 'Auth Service Rewrite', type: 'Project', url: '/delivery', description: 'Status: At Risk', icon: AlertTriangle },
    { id: 'proj-3', title: 'Mobile App Redesign', type: 'Project', url: '/delivery', description: 'Status: Delayed', icon: AlertTriangle },
];
