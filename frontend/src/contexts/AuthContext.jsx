import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [selectedIntegrations, setSelectedIntegrations] = useState([]);
    const [jiraData, setJiraData] = useState(null);
    const [githubRepos, setGithubRepos] = useState([]);
    const [issues, setIssues] = useState([]);
    const [pullRequests, setPullRequests] = useState([]);
    const [contributors, setContributors] = useState([]);
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    async function updateGitHubId(githubId) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            githubId,
            email: currentUser.email,
            lastUpdated: new Date()
        }, { merge: true });
    }

    async function saveSelectedIntegrations(integrations) {
        if (!currentUser) return;
        try {
            console.log("Saving integrations to Firebase:", integrations);
            setSelectedIntegrations(integrations);
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                selectedIntegrations: integrations,
                lastUpdated: new Date()
            }, { merge: true });
            console.log("Integrations saved successfully");
        } catch (err) {
            console.error("Error saving integrations:", err);
        }
    }

    async function saveJiraCredentials(jiraUrl, jiraEmail, jiraToken, jiraAccessToken, jiraAccountId, jiraResponseData) {
        if (!currentUser) {
            console.error("No current user, cannot save Jira credentials");
            return;
        }
        try {
            console.log("=== Saving Jira credentials to Supabase ===");
            console.log("jira_access_token:", jiraAccessToken);
            console.log("jira_account_id:", jiraAccountId);
            console.log("jira_server_url:", jiraUrl);
            console.log("jira_email:", jiraEmail);
            console.log("firebase_id:", currentUser.uid);
            
            // First check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('Users')
                .select('*')
                .eq('firebase_id', currentUser.uid)
                .single();
            
            console.log("Existing user data:", existingUser);
            if (fetchError) {
                console.error("Error fetching user:", fetchError);
                if (fetchError.code === 'PGRST116') {
                    console.log("User not found, will create new row with upsert");
                }
            }
            
            // Use upsert to handle both insert and update
            const { data: userData, error: userError } = await supabase
                .from('Users')
                .upsert({
                    firebase_id: currentUser.uid,
                    jira_server_url: jiraUrl,
                    jira_email: jiraEmail,
                    jira_api_token: jiraToken,
                    jira_account_id: jiraAccountId
                }, {
                    onConflict: 'firebase_id',
                    ignoreDuplicates: false
                })
                .select();
            
            if (userError) {
                console.error("❌ Supabase error saving Jira credentials:", userError);
                console.error("Error details:", JSON.stringify(userError, null, 2));
                throw userError;
            }
            
            console.log("✅ User data upserted:", userData);
            console.log("Rows affected:", userData?.length || 0);
            
            if (!userData || userData.length === 0) {
                console.error("❌ No rows were updated/inserted!");
            }
            
            // Verify the update
            const { data: verifyUser, error: verifyError } = await supabase
                .from('Users')
                .select('jira_account_id, jira_server_url, jira_email')
                .eq('firebase_id', currentUser.uid)
                .single();
            
            if (verifyError) {
                console.error("Error verifying user:", verifyError);
            } else {
                console.log("=== Verified data in Users table ===");
                console.log("jira_account_id:", verifyUser?.jira_account_id);
                console.log("jira_server_url:", verifyUser?.jira_server_url);
                console.log("jira_email:", verifyUser?.jira_email);
            }
            
            // Save response data to jira_data table
            if (jiraResponseData) {
                const { error: dataError } = await supabase
                    .from('jira_data')
                    .insert({
                        user_id: currentUser.uid,
                        jira_payload: jiraResponseData,
                        synced_at: new Date().toISOString()
                    });
                
                if (dataError) {
                    console.error("Supabase error saving Jira data:", dataError);
                }
            }
            
            console.log("Jira credentials and data saved successfully");
        } catch (err) {
            console.error("Error saving Jira credentials:", err);
            throw err;
        }
    }

    async function fetchJiraDataWithToken(accessToken, endpoint = '/webhooks/jira') {
        try {
            console.log(`Fetching Jira data from ${endpoint} with bearer token`);
            const response = await fetch(`https://rudraaaa76-jira-api.hf.space${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Jira data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Jira data fetched from ${endpoint}:`, data);
            return data;
        } catch (err) {
            console.error("Error fetching Jira data:", err);
            throw err;
        }
    }

    useEffect(() => {
        let unsubscribeFirestore = () => { };

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Sync user with Supabase
                const syncUserWithSupabase = async () => {
                    if (!user?.uid) return;
                    try {
                        console.log("Supabase: Attempting sync for UID:", user.uid);
                        const { data, error } = await supabase
                            .from('Users')
                            .upsert({
                                firebase_id: user.uid
                            }, { onConflict: 'firebase_id' })
                            .select();

                        if (error) {
                            console.error("Supabase Sync Error Details:", {
                                message: error.message,
                                details: error.details,
                                hint: error.hint,
                                code: error.code
                            });
                        } else {
                            console.log("Supabase Sync Success:", data);
                        }
                    } catch (err) {
                        console.error("Supabase Technical Exception:", err);
                    }
                };
                syncUserWithSupabase();

                // First, load selected integrations from Firebase
                const loadIntegrations = async () => {
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        const docSnap = await getDoc(userRef);
                        if (docSnap.exists()) {
                            const integrations = docSnap.data().selectedIntegrations || [];
                            console.log("Loaded integrations from Firebase:", integrations);
                            setSelectedIntegrations(integrations);
                            
                            // Now fetch data based on selected integrations
                            if (integrations.includes('jira')) {
                                fetchJiraData();
                            } else {
                                console.log("Jira not selected, skipping");
                                setJiraData(null);
                            }
                            
                            if (integrations.includes('github')) {
                                fetchGithubRepos();
                                fetchIssues();
                                fetchPullRequests();
                                fetchContributors();
                                fetchCommits();
                            } else {
                                console.log("GitHub not selected, skipping");
                                setGithubRepos([]);
                                setIssues([]);
                                setPullRequests([]);
                                setContributors([]);
                                setCommits([]);
                            }
                        }
                    } catch (err) {
                        console.error("Error loading integrations:", err);
                    }
                };

                // Fetch Jira data from Supabase
                const fetchJiraData = async () => {
                    try {
                        console.log("Fetching Jira data for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('jira_data')
                            .select('*')
                            .eq('user_id', user.uid)
                            .order('synced_at', { ascending: false })
                            .limit(1);

                        if (error) {
                            console.error("Jira data fetch error:", error);
                            setJiraData(null);
                        } else if (!data || data.length === 0) {
                            console.log("No Jira data found for user");
                            setJiraData(null);
                        } else {
                            console.log("Jira data fetched successfully:", data[0]);
                            console.log("Assigned issues count:", data[0].jira_payload?.assigned_issues?.length);
                            setJiraData(data[0]);
                        }
                    } catch (err) {
                        console.error("Jira data fetch exception:", err);
                        setJiraData(null);
                    }
                };

                // Fetch GitHub Repositories
                const fetchGithubRepos = async () => {
                    try {
                        console.log("Fetching GitHub repos for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('github')
                            .select('*')
                            .eq('firebase_id', user.uid);

                        if (error) {
                            console.error("GitHub repos fetch error:", error);
                            setGithubRepos([]);
                        } else {
                            console.log("GitHub repos fetched:", data?.length || 0);
                            setGithubRepos(data || []);
                        }
                    } catch (err) {
                        console.error("GitHub repos fetch exception:", err);
                    }
                };
                fetchGithubRepos();

                // Fetch Issues
                const fetchIssues = async () => {
                    try {
                        console.log("Fetching Issues for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('issues')
                            .select('*')
                            .eq('firebase_id', user.uid)
                            .order('created_at', { ascending: false });

                        if (error) {
                            console.error("Issues fetch error:", error);
                            setIssues([]);
                        } else {
                            console.log("Issues fetched:", data?.length || 0);
                            setIssues(data || []);
                        }
                    } catch (err) {
                        console.error("Issues fetch exception:", err);
                    }
                };

                // Fetch Pull Requests
                const fetchPullRequests = async () => {
                    try {
                        console.log("Fetching PRs for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('pull_requests')
                            .select('*')
                            .eq('firebase_id', user.uid)
                            .order('created_at', { ascending: false });

                        if (error) {
                            console.error("Pull Requests fetch error:", error);
                            setPullRequests([]);
                        } else {
                            console.log("Pull Requests fetched:", data?.length || 0);
                            setPullRequests(data || []);
                        }
                    } catch (err) {
                        console.error("Pull Requests fetch exception:", err);
                    }
                };

                // Fetch Contributors
                const fetchContributors = async () => {
                    try {
                        console.log("Fetching Contributors for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('contributors')
                            .select('*')
                            .eq('firebase_id', user.uid)
                            .order('contributions', { ascending: false });

                        if (error) {
                            console.error("Contributors fetch error:", error);
                            setContributors([]);
                        } else {
                            console.log("Contributors fetched:", data?.length || 0);
                            setContributors(data || []);
                        }
                    } catch (err) {
                        console.error("Contributors fetch exception:", err);
                    }
                };

                // Fetch Commits - FIXED: 'commits' not 'commit'
                const fetchCommits = async () => {
                    try {
                        console.log("Fetching Commits for firebase_id:", user.uid);
                        const { data, error } = await supabase
                            .from('commits')
                            .select('*')
                            .eq('firebase_id', user.uid)
                            .order('committed_date', { ascending: false });

                        if (error) {
                            console.error("Commits fetch error:", error);
                            setCommits([]);
                        } else {
                            console.log("Commits fetched:", data?.length || 0);
                            setCommits(data || []);
                        }
                    } catch (err) {
                        console.error("Commits fetch exception:", err);
                    }
                };

                // Start the data loading process
                loadIntegrations();
                
                const userRef = doc(db, 'users', user.uid);

                unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                        if (docSnap.data().selectedIntegrations) {
                            setSelectedIntegrations(docSnap.data().selectedIntegrations);
                        }
                    } else {
                        setUserData({ githubId: null });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore sync error:", error);
                    // Fallback to empty user data so UI can still render
                    setUserData({ githubId: null, error: "Database access denied" });
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, []);

    async function setOnboardingComplete() {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            onboardingCompleted: true,
            lastUpdated: new Date()
        }, { merge: true });
    }

    const value = {
        currentUser,
        userData,
        selectedIntegrations,
        jiraData,
        githubRepos,
        issues,
        pullRequests,
        contributors,
        commits,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateGitHubId,
        saveSelectedIntegrations,
        saveJiraCredentials,
        fetchJiraDataWithToken,
        setOnboardingComplete
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
