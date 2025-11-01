import { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import getTheme from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import PublicPage from './pages/PublicPage';
import DashboardLayout from './components/DashboardLayout';
import Storefront from './pages/dashboard/Storefront';

import Home from './pages/dashboard/Home';
import PageEditor from './pages/dashboard/PageEditor';
import Audience from './pages/dashboard/Audience';
import Analytics from './pages/dashboard/Analytics';
import Payouts from './pages/dashboard/Payouts';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';
import More from './pages/dashboard/More';
import Products from './pages/dashboard/Products'; // Import the Products component
import Orders from './pages/dashboard/Orders';
import Customers from './pages/dashboard/Customers';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Fixed routes first */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard routes - must come before dynamic route */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="page" element={<PageEditor />} />
            <Route path="audience" element={<Audience />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="more" element={<More darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
            {/* Add Products route */}
            <Route path="products" element={<Products />} />
            <Route path="storefront" element={<Storefront />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
          </Route>
          
          {/* Dynamic public page route - LAST to catch everything else */}
          <Route path="/:spaceName" element={<PublicPage />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;