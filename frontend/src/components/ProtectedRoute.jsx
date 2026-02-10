import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    // You might want to add a loading state check here if AuthContext has one
    // For now assuming currentUser is null if not logged in (after initial load)

    // In a real app, you'd want a proper loading state from AuthContext 
    // to avoid redirecting while firebase is initializing.
    // Since our AuthContext has a 'loading' state, let's expose and use it.
    // (I'll update AuthContext to export loading state if I haven't already - checked: yes I did)
    // Wait, I need to consume it.

    // Let's assume for a second the context provides it. 
    // Actually, looking at my AuthContext code, it renders children only when !loading.
    // So if we wrap this component in AuthProvider, we are good?
    // No, ProtectedRoute is a child of AuthProvider.
    // But AuthContext implementation:
    //    return (
    //      <AuthContext.Provider value={value}>
    //          {!loading && children}
    //      </AuthContext.Provider>
    //    );
    // So this component won't even mount until loading is false. 
    // Perfect.

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
