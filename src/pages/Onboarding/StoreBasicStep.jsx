import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { CheckCircle, MapPin, XCircle  } from '@phosphor-icons/react';

const StoreBasicStep = ({ 
  storeData, 
  onStoreDataChange, 
  whatsappError, 
  showWhatsappError 
}) => {
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);

  const handleWhatsAppChange = (e) => {
    const value = e.target.value;
    setHasTyped(true);
    setIsValid(false);
    setValidating(false);
    onStoreDataChange({ whatsappNumber: value });
  };

  const handleAddressChange = (e) => {
    onStoreDataChange({ address: e.target.value });
  };

  useEffect(() => {
    if (!storeData.whatsappNumber || !hasTyped) return;

    const cleanNumber = storeData.whatsappNumber.replace(/\s/g, '');
    
    // Only validate when user has typed exactly 10 digits (complete number)
    if (cleanNumber.length === 10) {
      setValidating(true);
      
      // Simulate API validation delay
      const validationTimer = setTimeout(() => {
        const nigeriaPhonePattern = /^(70[1-9]|80[1-9]|81[0-9]|90[1-9]|91[0-9])(\d{7})$/;
        const isValidNumber = nigeriaPhonePattern.test(cleanNumber);
        setIsValid(isValidNumber);
        setValidating(false);
      }, 1000);

      return () => clearTimeout(validationTimer);
    } else {
      setIsValid(false);
      setValidating(false);
    }
  }, [storeData.whatsappNumber, hasTyped]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        Store Basics
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
        Let's set up your store identity
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Store Name
        </Typography>
        <TextField
          variant="filled"
          fullWidth
          value={storeData.storeName}
          disabled
          sx={{
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'text.primary',
            }
          }}
        />
      </Box>
     
      <Box sx={{ mb: 4 }}>
  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
    WhatsApp Number
  </Typography>
  <TextField
    variant="filled"
    fullWidth
    value={storeData.whatsappNumber}
    onChange={handleWhatsAppChange}
    placeholder="801 234 5678"
    required
    error={showWhatsappError && !validating}
    inputProps={{ maxLength: 10 }}
    InputProps={{
      startAdornment: (
        <InputAdornment 
          position="start"
          sx={{ marginTop: '0px !important', mr: -1.5 }}
        >
          <Typography sx={{ color: 'text.primary', fontWeight: 500, fontSize:'15px' }}>
            +234
          </Typography>
        </InputAdornment>
      ),
      endAdornment: (
        <InputAdornment position="end">
          {validating && (
            <CircularProgress size={20} sx={{ color: 'text.secondary' }} />
          )}
          {isValid && !validating && (
            <CheckCircle size={20} color="#0FAA46" weight="fill" />
          )}
          {hasTyped && storeData.whatsappNumber.length === 10 && !validating && !isValid && (
            <XCircle size={20} color="#D32F2F" weight="fill" />
          )}
        </InputAdornment>
      ),
    }}
  />
</Box>

      <Box sx={{ mb: 3 }}>
  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
    Store Address
  </Typography>
  <TextField
    variant="filled"
    fullWidth
    value={storeData.address || ''}
    onChange={handleAddressChange}
    placeholder="Enter your store address"
    InputProps={{
      startAdornment: (
        <InputAdornment position="start" sx={{ marginTop: '0px !important' }}>
          <MapPin size={20} />
        </InputAdornment>
      ),
    }}
  />
</Box>
    </Box>
  );
};

export default StoreBasicStep;