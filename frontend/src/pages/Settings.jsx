import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { User, Bell, Monitor, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const Settings = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'display', label: 'Display', icon: Monitor },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg text-left transition-colors",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                <div className="flex-1 space-y-6">
                    {activeTab === 'profile' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>This is how others will see you on the site.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Email</label>
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Username</label>
                                    <input
                                        type="text"
                                        defaultValue="jdoe"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        This is your public display name.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Bio</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="Tell us a little bit about yourself"
                                        defaultValue="Engineering Lead at EntelliGen."
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                >
                                    {isLoading ? 'Saving...' : 'Save changes'}
                                </button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Configure how you receive notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <label className="text-base font-medium">Communication emails</label>
                                        <p className="text-sm text-muted-foreground">Receive emails about your account activity.</p>
                                    </div>
                                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <label className="text-base font-medium">Marketing emails</label>
                                        <p className="text-sm text-muted-foreground">Receive emails about new products, features, and more.</p>
                                    </div>
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <label className="text-base font-medium">Security emails</label>
                                        <p className="text-sm text-muted-foreground">Receive emails about your account security.</p>
                                    </div>
                                    <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary opacity-50" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    Save preferences
                                </button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'display' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Display</CardTitle>
                                <CardDescription>Turn items on or off to control what's displayed in the app.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-base font-medium">Sidebar Preference</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="sidebar" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                        <label htmlFor="sidebar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Always show sidebar on desktop </label>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    Update display
                                </button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
