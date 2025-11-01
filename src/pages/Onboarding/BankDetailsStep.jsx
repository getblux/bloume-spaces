import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { CheckCircle, MagnifyingGlass, X, Bank, CaretDown } from '@phosphor-icons/react';

const BankDetailsStep = ({
  storeData,
  onStoreDataChange,
  banks,
  loading,
  onResolveAccount,
  resolvingAccount,
  onCompleteSetup
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBanks = banks
    .filter(bank => bank.code !== "076")
    .filter(bank => 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Function to get bank logo URL
  const getBankLogo = (bankName) => {
    const formattedName = bankName.toLowerCase().replace(/\s+/g, '-');
    return `https://api.bitstack.africa/v1/banks/logo/${formattedName}`;
  };

  const handleBankSelect = (bankName, bankCode) => {
    onStoreDataChange({ 
      bankName: bankName,
      bankCode: bankCode
    });
    setDrawerOpen(false);
    setSearchTerm('');
  };

  const handleAccountNumberChange = (e) => {
    onStoreDataChange({ accountNumber: e.target.value });
  };

  const handleAccountNameChange = (e) => {
    onStoreDataChange({ accountName: e.target.value });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        Account Details
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
        Add your bank account information for payouts
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Bank Name
        </Typography>
        <TextField
          fullWidth
          value={storeData.bankName}
          onClick={() => setDrawerOpen(true)}
          placeholder="Select your bank"
          required
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
              <CaretDown size={20} weight="fill" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Account Number
        </Typography>
        <TextField
          variant="filled"
          fullWidth
          value={storeData.accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="Enter your account number"
          required
          inputProps={{ maxLength: 10 }}
          onBlur={() => storeData.bankCode && storeData.accountNumber && onResolveAccount()}
          InputProps={{
            endAdornment: resolvingAccount && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Account Holder Name
        </Typography>
        <TextField
          variant="filled"
          fullWidth
          value={storeData.accountName || ''}
          onChange={handleAccountNameChange}
          placeholder="Account holder name"
          required
          InputProps={{
            endAdornment: storeData.accountName && !resolvingAccount && (
              <InputAdornment position="end">
                <CheckCircle size={20} color="#0FAA46" weight="fill" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

   

      <Drawer
  anchor="bottom"
  open={drawerOpen}
  onClose={() => {
    setDrawerOpen(false);
    setSearchTerm('');
  }}
  sx={{
    '& .MuiBackdrop-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
    },
    '& .MuiDrawer-paper': {
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      maxHeight: '80vh',
      width: '98%',
      left: '1%',
      right: '1%',
      margin: '0 auto'
    }
  }}
>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Select Bank
            </Typography>
            <IconButton onClick={() => {
              setDrawerOpen(false);
              setSearchTerm('');
            }}>
              <X size={20} />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
        <TextField
  fullWidth
  placeholder="Search banks..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start" sx={{ marginTop: '0px !important' }}>
        <MagnifyingGlass size={20} />
      </InputAdornment>
    ),
  }}
  sx={{ mb: 2 }}
/>

          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {filteredBanks.map((bank) => (
              <ListItem
                key={bank.code}
                button
                onClick={() => handleBankSelect(bank.name, bank.code)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ListItemText primary={bank.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default BankDetailsStep;