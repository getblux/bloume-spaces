import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Button,
  Typography,
} from '@mui/material';
import { Sun, Moon } from '@phosphor-icons/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import StoreBasicStep from './Onboarding/StoreBasicStep';
import BankDetailsStep from './Onboarding/BankDetailsStep';

const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

const testPaystackConnection = async () => {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      }
    });
    const data = await response.json();
    console.log('Paystack connection test:', data);
    return data.status;
  } catch (error) {
    console.error('Paystack connection failed:', error);
    return false;
  }
};

const createTransactionSplit = async (userData, communityData, bankDetails) => {
  try {
    console.log('Creating transaction split for digital bank');
    
    const subaccountData = {
      business_name: communityData.title.substring(0, 100),
      bank_code: bankDetails.bankCode,
      account_number: bankDetails.accountNumber,
      percentage_charge: 0,
      settlement_schedule: 'daily',
      primary_contact_email: userData.email,
      primary_contact_name: userData.name.substring(0, 100),
      metadata: {
        userId: userData.uid,
        communityId: communityData.id
      }
    };

    console.log('Creating subaccount for split...');
    const subaccountResponse = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subaccountData)
    });

    const subaccountResult = await subaccountResponse.json();
    console.log('Subaccount creation response:', subaccountResult);

    if (!subaccountResult.status) {
      throw new Error(subaccountResult.message || 'Subaccount creation failed');
    }

    const splitData = {
      name: `${communityData.title.substring(0, 50)} - Revenue Share`,
      type: 'percentage',
      currency: 'NGN',
      bearer_type: 'subaccount',
      bearer_subaccount: subaccountResult.data.subaccount_code,
      subaccounts: [
        {
          subaccount: subaccountResult.data.subaccount_code,
          share: 85
        }
      ]
    };

    const splitResponse = await fetch('https://api.paystack.co/split', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(splitData)
    });

    const splitResult = await splitResponse.json();
    console.log('Split creation response:', splitResult);

    if (splitResult.status) {
      return {
        subaccountId: subaccountResult.data.subaccount_code,
        splitId: splitResult.data.id,
        bankVerified: true,
        paystackData: splitResult.data,
        paymentMethod: 'split'
      };
    } else {
      return {
        subaccountId: subaccountResult.data.subaccount_code,
        bankVerified: true,
        paymentMethod: 'subaccount'
      };
    }
  } catch (error) {
    console.error('Transaction split creation failed:', error);
    throw error;
  }
};

const createPaystackSubaccount = async (userData, communityData, bankDetails) => {
  try {
    console.log('API Key being used:', PAYSTACK_SECRET_KEY ? 'Present' : 'Missing');
    
    const connectionTest = await testPaystackConnection();
    if (!connectionTest) {
      throw new Error('Cannot connect to Paystack API. Check your secret key.');
    }

    const SUBACCOUNT_SUPPORTED_BANKS = ['057', '058', '011', '033', '032', '035', '044', '063', '050', '070'];
    const supportsSubaccount = SUBACCOUNT_SUPPORTED_BANKS.includes(bankDetails.bankCode);
    
    if (!supportsSubaccount) {
      console.log('Bank does not support subaccounts, using transaction split instead');
      return await createTransactionSplit(userData, communityData, bankDetails);
    }

    const subaccountData = {
      business_name: communityData.title.substring(0, 100),
      bank_code: bankDetails.bankCode,
      account_number: bankDetails.accountNumber,
      percentage_charge: 15,
      settlement_schedule: 'daily',
      primary_contact_email: userData.email,
      primary_contact_name: userData.name.substring(0, 100),
      metadata: {
        userId: userData.uid,
        communityId: communityData.id
      }
    };

    console.log('Creating subaccount with payload:', subaccountData);

    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subaccountData)
    });

    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Full Paystack response:', data);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.status) {
      throw new Error(data.message || `Paystack API error: ${JSON.stringify(data)}`);
    }

    return {
      subaccountId: data.data.subaccount_code,
      bankVerified: true,
      paystackData: data.data,
      paymentMethod: 'subaccount'
    };
  } catch (error) {
    console.error('Paystack subaccount creation failed:', error);
    return await createTransactionSplit(userData, communityData, bankDetails);
  }
};

const Onboarding = ({ darkMode, toggleDarkMode }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const location = useLocation();
  const spaceName = location.state?.spaceName;
  const ownerName = location.state?.ownerName;
  const [whatsappError, setWhatsappError] = useState(false);
  const [showWhatsappError, setShowWhatsappError] = useState(false);
  const [banks, setBanks] = useState([]);
  const [resolvingAccount, setResolvingAccount] = useState(false);

  const [storeData, setStoreData] = useState({
    storeName: spaceName || '',
    tagline: '',
    whatsappNumber: '',
    profileImage: null,
    profileImageUrl: '',
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    subaccountId: '',
    splitId: '',
    paymentMethod: '',
    bankVerified: false,
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const showSnackbar = (message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        if (!PAYSTACK_SECRET_KEY) {
          console.error('Paystack secret key is not defined');
          showSnackbar('Payment configuration error. Please contact support.');
          return;
        }
  
        const response = await fetch('https://api.paystack.co/bank', {
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.status) {
          const banksWithTest = [
            { name: "Test Bank", code: "076" },
            ...data.data
          ];
          console.log('Banks with test:', banksWithTest);
          setBanks(banksWithTest);
        } else {
          throw new Error(data.message || 'Failed to fetch banks');
        }
      } catch (error) {
        console.error('Failed to fetch banks:', error);
        const testBanks = [{ name: "Test Bank", code: "076" }];
        setBanks(testBanks);
        showSnackbar('Failed to load bank list. Using test mode.');
      }
    };
    fetchBanks();
  }, []);

  const handleResolveAccount = async () => {
    if (PAYSTACK_SECRET_KEY.includes('test')) {
      setStoreData(prev => ({ ...prev, accountName: "Test Account" }));
      showSnackbar('Test account - verification skipped', 'success');
      return;
    }
  
    if (!storeData.bankCode || !storeData.accountNumber || storeData.accountNumber.length !== 10) {
      return;
    }
  
    setResolvingAccount(true);
    try {
      const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${storeData.accountNumber}&bank_code=${storeData.bankCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        }
      });
  
      const data = await response.json();
      
      if (data.status) {
        setStoreData(prev => ({
          ...prev,
          accountName: data.data.account_name
        }));
        showSnackbar('Account verified successfully!', 'success');
      } else {
        showSnackbar('Failed to verify account. Please check your details.');
      }
    } catch (error) {
      console.error('Bank resolution failed:', error);
      showSnackbar('Failed to verify account');
    } finally {
      setResolvingAccount(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!storeData.bankName || !storeData.accountNumber || !storeData.accountName) {
      showSnackbar('Please verify your bank account first');
      return;
    }
  
    setLoading(true);
    try {
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: ownerName || currentUser.displayName || 'Store Owner'
      };
  
      const communityData = {
        title: storeData.storeName,
        id: spaceName.toLowerCase()
      };
  
      const bankDetails = {
        bankCode: storeData.bankCode,
        accountNumber: storeData.accountNumber
      };
  
      const result = await createPaystackSubaccount(userData, communityData, bankDetails);
      
      setStoreData(prev => ({
        ...prev,
        subaccountId: result.subaccountId,
        splitId: result.splitId,
        paymentMethod: result.paymentMethod,
        bankVerified: result.bankVerified
      }));
      
      showSnackbar('Payment account created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create payment account:', error);
      showSnackbar('Failed to create payment account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!validateWhatsApp(storeData.whatsappNumber)) {
      showSnackbar('Please enter a valid WhatsApp number');
      return;
    }
  
    setLoading(true);
    try {
      let profileImageUrl = '';
      
      if (storeData.profileImage) {
        const formData = new FormData();
        formData.append('file', storeData.profileImage);
        formData.append('upload_preset', 'my_products');
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dz0vrbq8o/image/upload`,
          { method: 'POST', body: formData }
        );
        const data = await response.json();
        profileImageUrl = data.secure_url;
      }
  
      const { profileImage, ...storeDataWithoutFile } = storeData;

      await setDoc(doc(db, 'stores', spaceName.toLowerCase()), {
        ownerId: currentUser.uid,
        ownerName: ownerName,
        ...storeDataWithoutFile,
        profileImageUrl: profileImageUrl,
        createdAt: new Date(),
        storeType: 'physical'
      });
  
      localStorage.removeItem('physicalOnboarding');
      navigate('/dashboard');
    } catch (error) {
      console.error('Setup failed:', error);
      showSnackbar('Failed to save store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storeData.whatsappNumber) {
      setShowWhatsappError(false);
      return;
    }

    const timer = setTimeout(() => {
      const isValid = validateWhatsApp(storeData.whatsappNumber);
      setWhatsappError(!isValid);
      setShowWhatsappError(!isValid);
    }, 1000);

    return () => clearTimeout(timer);
  }, [storeData.whatsappNumber]);

  const validateWhatsApp = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    const nigeriaPhonePattern = /^(70[1-9]|80[1-9]|81[0-9]|90[1-9]|91[0-9])(\d{7})$/;
    return nigeriaPhonePattern.test(cleanNumber);
  };

  useEffect(() => {
    const saved = localStorage.getItem('physicalOnboarding');
    if (saved) {
      const { step, storeData: savedStore } = JSON.parse(saved);
      setActiveStep(step);
      setStoreData(savedStore);
    }
  }, []);

  useEffect(() => {
    const progress = {
      step: activeStep,
      storeData,
    };
    localStorage.setItem('physicalOnboarding', JSON.stringify(progress));
  }, [activeStep, storeData]);

  const renderFormStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <StoreBasicStep
            storeData={storeData}
            onStoreDataChange={(updates) => setStoreData(prev => ({...prev, ...updates}))}
            whatsappError={whatsappError}
            showWhatsappError={showWhatsappError}
          />
        );
      case 1:
        return (
          <BankDetailsStep
            storeData={storeData}
            onStoreDataChange={(updates) => setStoreData(prev => ({...prev, ...updates}))}
            banks={banks}
            loading={loading}
            onResolveAccount={handleResolveAccount}
            resolvingAccount={resolvingAccount}
            onCreateSubaccount={handleCreateSubaccount}
            onCompleteSetup={handleCompleteSetup}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 4,
        overflow: 'auto'
      }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Box>

        <Box sx={{ maxWidth: 500, mx: 'auto', width: '100%' }}>
          {renderFormStep()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
  <Button 
    onClick={() => setActiveStep(activeStep - 1)}
    disabled={activeStep === 0}
  >
    Back
  </Button>
  
  {activeStep === 1 ? (
    <Button
      variant="contained"
      onClick={handleCompleteSetup}
      disabled={loading || !storeData.storeName || !storeData.whatsappNumber || !storeData.bankName || !storeData.accountNumber || !storeData.accountName}
      sx={{ minWidth: 120 }}
    >
      {loading ? <CircularProgress size={24} /> : 'Finish Setup'}
    </Button>
  ) : (
    <Button
      variant="contained"
      onClick={() => setActiveStep(activeStep + 1)}
      disabled={!storeData.storeName || !storeData.whatsappNumber}
      sx={{ minWidth: 120 }}
    >
      Next
    </Button>
  )}
</Box>
        </Box>
      </Box>

      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: '50%',
        position: 'fixed',
        right: 0,
        height: '100vh',
        overflow: 'auto',
        bgcolor: 'transparent',
        borderLeft: '1px solid',
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1,
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          border: '1px',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
          p: 3,
          backgroundColor:'#f5f5f5'
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            Store Preview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Your store preview will appear here
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Onboarding;