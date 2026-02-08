import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import IntegrationOnboarding from './IntegrationOnboarding';

const ProtectedRoute = ({ children }) => {
    const { currentUser, userData } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Show onboarding if not completed
    if (!userData?.onboardingCompleted) {
        return <IntegrationOnboarding />;
    }

    return children;
};

export default ProtectedRoute;
