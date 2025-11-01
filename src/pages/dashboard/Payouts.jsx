import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme
} from '@mui/material';
import { AccountBalance, TrendingUp } from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const Payouts = () => {
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    fetchPayoutsAndBalance();
  }, [currentUser]);

  const fetchPayoutsAndBalance = async () => {
    if (!currentUser) return;

    try {
      // Only fetch REAL automatic payments from payments collection
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('communityId', '==', currentUser.uid),
        where('status', '==', 'success')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);

      let totalEarnings = 0;
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        // Only count real monetary transactions (ignore any mock data if present)
        if (payment.status === 'success' && !payment.isMockData) {
          totalEarnings += payment.amount;
        }
      });

      // Fetch payout requests
      const payoutsQuery = query(
        collection(db, 'payouts'),
        where('userId', '==', currentUser.uid)
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);

      let totalPayouts = 0;
      const payoutsData = [];
      payoutsSnapshot.forEach(doc => {
        const payout = doc.data();
        totalPayouts += payout.amount;
        payoutsData.push({ id: doc.id, ...payout });
      });

      // Balance = Real earnings minus payouts already made
      setBalance(totalEarnings - totalPayouts);
      setPayouts(payoutsData.sort((a, b) => b.date?.toDate() - a.date?.toDate()));
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (balance < 1000) {
      toast.error('Minimum payout amount is ₦1,000');
      return;
    }
  
    if (!userProfile?.bankName || !userProfile?.accountNumber) {
      toast.error('Please add your bank details in Settings');
      return;
    }
  
    setLoading(true);
    try {
      await addDoc(collection(db, 'payouts'), {
        userId: currentUser.uid,
        amount: balance,
        date: new Date(),
        status: 'pending',
        bankName: userProfile.bankName,
        accountNumber: userProfile.accountNumber
      });
  
      // ADD NOTIFICATION
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        type: 'payout',
        message: `Payout request of ₦${balance.toLocaleString()} submitted`,
        isRead: false,
        createdAt: new Date()
      });
  
      toast.success('Payout request submitted successfully!');
      fetchPayoutsAndBalance();
    } catch (error) {
      console.error(error);
      toast.error('Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ px: 1, py: 5 }}>
      <Typography variant="h2" sx={{ 
        fontWeight: 600, 
        mb: 1, 
        fontSize: { xs: '22px', sm: '28px' },
        color: theme.palette.text.primary
      }}>
        Payouts
      </Typography>
      <Typography variant="h6" sx={{ 
        fontWeight: 400, 
        color: theme.palette.text.primary,
        mb: 4
      }}>
        Manage your earnings and payouts
      </Typography>

    {/* Balance Card */}
<Paper sx={{ 
  p: 3, 
  borderRadius: '10px',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20, ${theme.palette.background.default}80)`,
  border: `1px solid ${theme.palette.divider}`,
  mb: 3,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20, ${theme.palette.background.default}80)`,
    backgroundSize: '400% 400%',
    animation: 'gradientShift 6s ease infinite',
    zIndex: 0,
  }
}} elevation={0}>
  
  {/* Add this to your global CSS or theme */}
  <style>
    {`
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}
  </style>

  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
    <Box>
      <Typography variant="body2" sx={{ 
        fontWeight: 500, 
        fontSize: '14px', 
        fontFamily: "Inter",
        color: theme.palette.text.secondary,
        mb: 1
      }}>
        Available Balance
      </Typography>
      <Typography variant="h3" sx={{ 
        fontWeight: 500, 
        color: theme.palette.text.primary,
        mb: 3,
        fontSize: { xs: '32px', sm: '48px' },
        fontFamily: 'Inter'
      }}>
        ₦{balance.toLocaleString()}
      </Typography>
      <Button
        variant="contained"
        onClick={handleRequestPayout}
        disabled={loading || balance < 1000}
        sx={{ borderRadius: '8px' }}
      >
        {loading ? 'Processing...' : 'Request Payout'}
      </Button>
      {balance < 1000 && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
          Minimum payout: ₦1,000
        </Typography>
      )}
    </Box>
    <Box sx={{ color: theme.palette.primary.main, opacity: 0.7 }}>
      <AccountBalance sx={{ fontSize: { xs: 40, sm: 50 } }} />
    </Box>
  </Box>
</Paper>

      {/* Bank Details Card */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: '10px',
        backgroundColor: theme.palette.background.default,
        border: `1px solid ${theme.palette.divider}`,
        mb: 3
      }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 500, 
              fontSize: '14px', 
              fontFamily: "Inter",
              color: theme.palette.text.secondary,
              mb: 1
            }}>
              Bank Details
            </Typography>
            <Typography variant="h6" sx={{ 
              fontWeight: 500, 
              mb: 0.5,
              color: theme.palette.text.primary
            }}>
              {userProfile?.bankName || 'Not set'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
              {userProfile?.accountNumber || 'Add your bank details in Settings'}
            </Typography>
          </Box>
          <Box sx={{ color: theme.palette.primary.main, opacity: 0.7 }}>
            <TrendingUp sx={{ fontSize: { xs: 40, sm: 50 } }} />
          </Box>
        </Box>
      </Paper>

      {/* Payout History Card */}
      <Paper sx={{ 
        borderRadius: '10px',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden'
      }} elevation={0}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 500,
            color: theme.palette.text.primary
          }}>
            Payout History
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Inter' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Inter' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Inter' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Inter' }}>
                      No payout history yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id} hover>
                    <TableCell sx={{ fontFamily: 'Inter' }}>
                      {payout.date?.toDate ? dayjs(payout.date.toDate()).format('MMM D, YYYY') : '-'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontWeight: 500 }}>
                      ₦{payout.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payout.status}
                        color={getStatusColor(payout.status)}
                        size="small"
                        sx={{ fontWeight: 500, fontFamily: 'Inter' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Payouts;