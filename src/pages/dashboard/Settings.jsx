import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  useTheme,
  Alert
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [storeData, setStoreData] = useState({
    storeName: '',
    profileImageUrl: '',
    whatsappNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const [profileFile, setProfileFile] = useState(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (currentUser) {
        try {
          const storeName = 'lumen';
          const storeRef = doc(db, 'stores', storeName.toLowerCase());
          const storeSnapshot = await getDoc(storeRef);
          
          if (storeSnapshot.exists()) {
            const data = storeSnapshot.data();
            setStoreData({
              storeName: data.storeName || '',
              profileImageUrl: data.profileImageUrl || '',
              whatsappNumber: data.whatsappNumber || '',
              bankName: data.bankName || '',
              accountNumber: data.accountNumber || '',
              accountName: data.accountName || ''
            });
          }
        } catch (error) {
          console.error('Error fetching store data:', error);
        }
      }
    };
    fetchStoreData();
  }, [currentUser]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreData({ ...storeData, profileImageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      let profileImageUrl = storeData.profileImageUrl;

      if (profileFile) {
        const storageRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}`);
        await uploadBytes(storageRef, profileFile);
        profileImageUrl = await getDownloadURL(storageRef);
      }

      const storeName = 'lumen';
      await updateDoc(doc(db, 'stores', storeName.toLowerCase()), {
        storeName: storeData.storeName,
        profileImageUrl: profileImageUrl,
        whatsappNumber: storeData.whatsappNumber,
        bankName: storeData.bankName,
        accountNumber: storeData.accountNumber,
        accountName: storeData.accountName
      });

      setProfileFile(null);
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Full error:', error);
      toast.error('Failed to update settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ px: 1, py: 5 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 600, 
        mb: 1,
        color: theme.palette.text.primary
      }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ 
        color: theme.palette.text.secondary,
        mb: 4
      }}>
        Manage your store settings
      </Typography>

      {/* Store Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
        <Avatar
          src={storeData.profileImageUrl}
          sx={{ width: 80, height: 80, mr: 3 }}
        >
          {storeData.storeName?.[0]?.toUpperCase() || 'S'}
        </Avatar>
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-upload"
            type="file"
            onChange={handleProfileImageChange}
          />
          <label htmlFor="profile-upload">
            <Button component="span" variant="outlined" startIcon={<PhotoCamera />}>
              Change Logo
            </Button>
          </label>
        </Box>
      </Box>

      {/* Settings Rows */}
      <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Store Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ width: '200px', flexShrink: 0, fontWeight: 500 }}>
            Store Name
          </Typography>
          <TextField
            fullWidth
            value={storeData.storeName}
            onChange={(e) => setStoreData({...storeData, storeName: e.target.value})}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder="Enter store name"
          />
        </Box>

        {/* WhatsApp Number */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ width: '200px', flexShrink: 0, fontWeight: 500 }}>
            WhatsApp Number
          </Typography>
          <TextField
            fullWidth
            value={storeData.whatsappNumber}
            onChange={(e) => setStoreData({...storeData, whatsappNumber: e.target.value})}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder="Enter WhatsApp number"
          />
        </Box>

        {/* Bank Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ width: '200px', flexShrink: 0, fontWeight: 500 }}>
            Bank Name
          </Typography>
          <TextField
            fullWidth
            value={storeData.bankName}
            onChange={(e) => setStoreData({...storeData, bankName: e.target.value})}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder="Enter bank name"
          />
        </Box>

        {/* Account Number */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ width: '200px', flexShrink: 0, fontWeight: 500 }}>
            Account Number
          </Typography>
          <TextField
            fullWidth
            value={storeData.accountNumber}
            onChange={(e) => setStoreData({...storeData, accountNumber: e.target.value})}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder="Enter account number"
          />
        </Box>

        {/* Account Holder Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
          <Typography sx={{ width: '200px', flexShrink: 0, fontWeight: 500 }}>
            Account Holder
          </Typography>
          <TextField
            fullWidth
            value={storeData.accountName}
            onChange={(e) => setStoreData({...storeData, accountName: e.target.value})}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder="Enter account holder name"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveAll}
          disabled={loading}
          sx={{ px: 4 }}
        >
          {loading ? 'Saving...' : 'Save All Changes'}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {successMessage}
        </Alert>
      )}
    </Box>
  );
};

export default Settings;