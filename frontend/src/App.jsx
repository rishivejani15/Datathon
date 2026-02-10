import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Workforce from './pages/Workforce';
import Delivery from './pages/Delivery';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Finance from './pages/Finance';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/finance" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Finance />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/workforce" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Workforce />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/delivery" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Delivery />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
