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
                            }, { onConflict: 'firebase_id' });

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

                // Initialize/Sync user data from Firestore
                const userRef = doc(db, 'users', user.uid);

                unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
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
        login,
        signup,
        loginWithGoogle,
        logout,
        updateGitHubId,
        setOnboardingComplete
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
