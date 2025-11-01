import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Eye, EyeSlash, Sun, Moon } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';


const Auth = ({ darkMode, toggleDarkMode }) => {
  const [authTab, setAuthTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: '', progress: 0 });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const spaceName = location.state?.spaceName;

  const validatePassword = (password) => {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    if (hasLowercase) strength += 1;
    if (hasUppercase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecialChars) strength += 1;

    switch (strength) {
      case 1: return { level: 'Weak', progress: 25 };
      case 2: return { level: 'Better', progress: 50 };
      case 3: return { level: 'Strong', progress: 75 };
      case 4: return { level: 'You nailed it!', progress: 100 };
      default: return { level: '', progress: 0 };
    }
  };

  const handleAuthTabChange = (event, newValue) => {
    setAuthTab(newValue);
    setError('');
    setFormData({ name: '', email: '', password: '' });
    setPasswordStrength({ level: '', progress: 0 });
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (authTab === 0) {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
  
        if (!spaceName) {
          setError('Space name is required');
          setLoading(false);
          return;
        }
  
        console.log('1. Starting signup with Node.js backend...');
        
        // Call your Node.js backend instead of Firebase
        const result = await signup(formData.email, formData.password, formData.name, spaceName);
        console.log('2. Signup successful:', result);
        
        // Use the user data from your backend response
        const userData = result.user;
        console.log('3. User data:', userData);
        
        console.log('4. Registration complete with virtual account');
        
        // Navigate to onboarding with the user data
        navigate('/onboarding', { 
          state: { 
            spaceName: spaceName.toLowerCase(),
            ownerName: formData.name,
            userData: userData // Pass the full user data
          } 
        });
  
      } else {
        // Keep Firebase login for now, or implement backend login later
        if (!formData.email || !formData.password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await login(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      // Handle backend errors instead of Firebase errors
      if (err.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.message.includes('valid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Left Panel - Form */}
      <Box sx={{
        width: { xs: '100%', md: '60%' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Box sx={{ width: '100%', maxWidth: '650px', p: { xs: 3, sm: 4 } }}>
          <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
            <IconButton onClick={toggleDarkMode} sx={{ color: 'text.primary' }}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Box>

          <Typography variant="h2" sx={{ 
            fontWeight: 700, 
            mb: 1, 
            textAlign: 'left',
            fontSize: { xs: '24px', sm: '30px' },
            letterSpacing: '-0.2px',
            color: 'text.primary'
          }}>
            {authTab === 0 ? 'Create your free account' : 'Welcome back'}
          </Typography>
          <Typography variant="body1" sx={{ 
            mb: 4, 
            color: 'text.secondary', 
            textAlign: 'left',
            fontSize: { xs: '16px', sm: '16px' }
          }}>
           {authTab === 0 ? (
  <Typography variant="body1" sx={{ 
    mb: 4, 
    color: 'text.secondary', 
    textAlign: 'left',
    fontSize: { xs: '16px', sm: '16px' }
  }}>
    Let's get <strong>bloume.shop/{spaceName}</strong> set up
  </Typography>
) : (
  <Typography variant="body1" sx={{ 
    mb: 4, 
    color: 'text.secondary', 
    textAlign: 'left',
    fontSize: { xs: '16px', sm: '16px' }
  }}>
    Sign in to your bloume space
  </Typography>
)}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

<Box component="form" onSubmit={handleAuthSubmit} sx={{ width: '100%' }}>
  {authTab === 0 && (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
        What should we call you?
      </Typography>
      <TextField
        variant="filled"
        fullWidth
        name="name"
        
        value={formData.name}
        onChange={handleAuthChange}
        required
      />
    </Box>
  )}

  <Box sx={{ mb: 3 }}>
  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
      Your Email Address
    </Typography>
    <TextField
      variant="filled"
      fullWidth
      type="email"
      name="email"
      
      value={formData.email}
      onChange={handleAuthChange}
      required
    />
  </Box>

  <Box sx={{ mb: 3 }}>
  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
      Password
    </Typography>
    <TextField
      variant="filled"
      fullWidth
      type={showPassword ? 'text' : 'password'}
      name="password"
     
      value={formData.password}
      onChange={handleAuthChange}
      required
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ padding: '8px' }}>
              {showPassword ? 
                <EyeSlash size={20} weight="duotone" /> : 
                <Eye size={20} weight="duotone" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
    {formData.password && authTab === 0 && (
      <Box sx={{ width: '100%', mt: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={passwordStrength.progress}
          sx={{ 
            height: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor: 
                passwordStrength.progress <= 25 ? '#0FAA46' : 
                passwordStrength.progress <= 50 ? '#0FAA46' : 
                passwordStrength.progress <= 75 ? '#0FAA46' : '#4caf50'
            }
          }} 
        />
        <Typography 
          variant="body2" 
          textAlign="right" 
          sx={{ 
            mt: 0.5,
            color: 
              passwordStrength.progress <= 25 ? '#0FAA46' : 
              passwordStrength.progress <= 50 ? '#0FAA46' : 
              passwordStrength.progress <= 75 ? '#0FAA46' : '#4caf50'
          }}
        >
          {passwordStrength.level}
        </Typography>
      </Box>
    )}
  </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                height: 48,
                borderRadius: '8px',
                mb: 2
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : authTab === 0 ? 'Create Account' : 'Sign In'}
            </Button>

            {authTab === 0 ? (
              <Typography variant="body2" textAlign="center" sx={{ color: 'text.secondary' }}>
                Already have an account?{' '}
                <Button 
                  onClick={() => setAuthTab(1)}
                  sx={{ color: '#0FAA46', fontWeight: 600, textDecoration: 'none', minWidth: 'auto' }}
                >
                  Sign In
                </Button>
              </Typography>
            ) : (
              <Typography variant="body2" textAlign="center" sx={{ color: 'text.secondary' }}>
                Don't have an account?{' '}
                <Button 
                  onClick={() => setAuthTab(0)}
                  sx={{ color: '#0FAA46', fontWeight: 600, textDecoration: 'none', minWidth: 'auto' }}
                >
                  Sign Up
                </Button>
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Image */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '40%',
        position: 'fixed',
        right: 0,
        height: '100vh',
        p: '6px',
        backgroundColor: 'transparent'
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          borderRadius: '15px',
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1)), url('/assets/waitlist-image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          p: 4
        }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 1, textAlign: 'left' }}>
            Get ready to start selling
          </Typography>
          <Typography variant="body1" sx={{ color: '#fff', textAlign: 'left', maxWidth: '80%' }}>
            Connect, collaborate, and build the future
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;