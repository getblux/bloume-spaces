import { Box, Container, Typography, Button, TextField, Alert } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const [spaceName, setSpaceName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkSpaceName = async () => {
      if (spaceName.length < 3) {
        setError('Space name must be at least 3 characters');
        setIsAvailable(false);
        return;
      }
  
      if (!/^[a-zA-Z0-9-]+$/.test(spaceName)) {
        setError('Only letters, numbers, and hyphens allowed');
        setIsAvailable(false);
        return;
      }
  
      setIsChecking(true);
      setError('');
  
      try {
        // Call your Node.js backend instead of Firestore
        const response = await fetch(`http://localhost:3000/check-store/${spaceName.toLowerCase()}`);
        const data = await response.json();
        
        if (data.success) {
          setIsAvailable(data.available);
          if (!data.available) {
            setError('This store name is already taken');
          }
        } else {
          setError('Unable to check availability. Please try again.');
          setIsAvailable(false);
        }
      } catch (err) {
        console.error('API error:', err);
        setError('Unable to check availability. Please try again.');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };
  
    const debounceTimer = setTimeout(checkSpaceName, 500);
    return () => clearTimeout(debounceTimer);
  }, [spaceName]);

  const handleGetStarted = () => {
    if (isAvailable) {
      navigate('/auth', { state: { spaceName: spaceName.toLowerCase() } });
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0FAA46 0%, #0A7831 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <WhatsApp sx={{ fontSize: 80, mb: 3, opacity: 0.9 }} />
          
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 400, mb: 2 }}>
            The fastest way to sell anything
          </Typography>

          <Typography variant="h5" sx={{ mb: 4, opacity: 0.95, maxWidth: 600, mx: 'auto' }}>
            Build passion-based groups and charge for access. Combine Udemy + Patreon + WhatsApp.
          </Typography>

          <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder="your-space-name"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ color: 'white', mr: 1 }}>
                    bloume.shop/
                  </Typography>
                ),
              }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                '& .MuiInputBase-input': {
                  color: 'white',
                  py: 2,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid rgba(255,255,255,0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid rgba(255,255,255,0.5)',
                },
              }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.1)' }}>
                {error}
              </Alert>
            )}
            {isAvailable && (
             <Alert severity="success" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.1)' }}>
  Store name available!
</Alert>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            disabled={!isAvailable || isChecking}
            sx={{
              bgcolor: 'white',
              color: '#0FAA46',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': { bgcolor: '#f5f5f5' },
              '&:disabled': { bgcolor: 'rgba(255,255,255,0.5)' }
            }}
          >
            {isChecking ? 'Checking...' : 'Get Started'}
          </Button>

          <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ maxWidth: 250 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Easy Setup</Typography>
              <Typography sx={{ opacity: 0.9 }}>Get started in minutes with our simple onboarding process</Typography>
            </Box>
            <Box sx={{ maxWidth: 250 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Secure Payments</Typography>
              <Typography sx={{ opacity: 0.9 }}>Integrated Paystack for seamless payments</Typography>
            </Box>
            <Box sx={{ maxWidth: 250 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Auto Access</Typography>
              <Typography sx={{ opacity: 0.9 }}>Members automatically receive WhatsApp links after payment</Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;