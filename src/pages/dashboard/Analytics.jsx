import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import RevenueLineChart from './charts/RevenueLineChart';
import MemberGrowthChart from './charts/MemberGrowthChart';
import PaymentStatusChart from './charts/PaymentStatusChart';
import RevenueByPlanChart from './charts/RevenueByPlanChart';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalMembers: 0,
    newMembers: 0,
    recentPayments: 0
  });
  const [trends, setTrends] = useState({
    earnings: 0,
    members: 0,
    newMembers: 0,
    payments: 0
  });
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser]);

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getDateRanges = () => {
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { currentPeriodStart, previousPeriodStart, previousPeriodEnd };
  };

  const fetchAnalytics = async () => {
    if (!currentUser) return;

    try {
      const { currentPeriodStart, previousPeriodStart, previousPeriodEnd } = getDateRanges();

      // Fetch both automatic payments and manual member payments
      const paymentsQuery = query(collection(db, 'payments'), where('communityId', '==', currentUser.uid));
      const paymentsSnapshot = await getDocs(paymentsQuery);

      const membersQuery = query(collection(db, 'members'), where('communityId', '==', currentUser.uid));
      const membersSnapshot = await getDocs(membersQuery);

      // Current period calculations
      let currentEarnings = 0;
      let currentMembers = 0;
      let currentNewMembers = 0;
      let currentPayments = 0;

      // Previous period calculations
      let previousEarnings = 0;
      let previousMembers = 0;
      let previousNewMembers = 0;
      let previousPayments = 0;

      // Process automatic payments (from payments collection)
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        if (payment.status === 'success') {
          const paymentDate = payment.date?.toDate;
          
          if (paymentDate) {
            const date = payment.date.toDate();
            if (date >= currentPeriodStart) {
              currentEarnings += payment.amount;
              currentPayments++;
            } else if (date >= previousPeriodStart && date <= previousPeriodEnd) {
              previousEarnings += payment.amount;
              previousPayments++;
            }
          }
        }
      });

      // Process manual member payments (from members collection with paymentAmount > 0)
      membersSnapshot.forEach(doc => {
        const member = doc.data();
        const joinDate = member.joinDate?.toDate;
        
        if (joinDate) {
          const date = member.joinDate.toDate();
          
          // Count members for growth stats
          if (date >= currentPeriodStart) {
            currentMembers++;
            currentNewMembers++;
          } else if (date >= previousPeriodStart && date <= previousPeriodEnd) {
            previousMembers++;
            previousNewMembers++;
          }
        }

        // Add manual payments to revenue (paymentAmount > 0)
        if (member.paymentAmount && member.paymentAmount > 0) {
          const paymentDate = member.joinDate?.toDate;
          
          if (paymentDate) {
            const date = member.joinDate.toDate();
            if (date >= currentPeriodStart) {
              currentEarnings += member.paymentAmount;
              currentPayments++;
            } else if (date >= previousPeriodStart && date <= previousPeriodEnd) {
              previousEarnings += member.paymentAmount;
              previousPayments++;
            }
          }
        }
      });

      setStats({
        totalEarnings: currentEarnings + previousEarnings,
        totalMembers: currentMembers + previousMembers,
        newMembers: currentNewMembers,
        recentPayments: currentPayments
      });

      setTrends({
        earnings: calculatePercentageChange(currentEarnings, previousEarnings),
        members: calculatePercentageChange(currentMembers, previousMembers),
        newMembers: calculatePercentageChange(currentNewMembers, previousNewMembers),
        payments: calculatePercentageChange(currentPayments, previousPayments)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Earnings',
      value: `₦${stats.totalEarnings.toLocaleString()}`,
      trend: trends.earnings,
      color: '#0FAA46'
    },
    {
      title: 'Total Members',
      value: stats.totalMembers,
      trend: trends.members,
      color: '#2196F3'
    },
    {
      title: 'New Members',
      value: stats.newMembers,
      trend: trends.newMembers,
      color: '#FF9800'
    },
    {
      title: 'Recent Payments',
      value: stats.recentPayments,
      trend: trends.payments,
      color: '#9C27B0'
    }
  ];

  return (
    <Box sx={{ px: 1, py: 5 }}>
      <Typography variant="h2" sx={{ 
        fontWeight: 600, 
        mb: 1, 
        fontSize: { xs: '22px', sm: '28px' },
        color: theme.palette.text.primary
      }}>
        Analytics
      </Typography>
      <Typography variant="h6" sx={{ 
        fontWeight: 400, 
        color: theme.palette.text.primary,
        mb: 4
      }}>
        Track your community performance
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ width: '100%', mb: 3 }}>
        {isMobile ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
            {statCards.map((stat, index) => (
              <Paper
                key={index}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  px: 2,
                  py: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  height: '100%',
                  gridRow: index < 2 ? 1 : 2,
                  gridColumn: index % 2 === 0 ? 1 : 2,
                }}
                elevation={0}
              >
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  fontSize: '13px', 
                  fontFamily: "Inter",
                  color: theme.palette.text.secondary
                }}>
                  {stat.title}
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500, 
                  fontSize: '30px', 
                  fontFamily: "'Inter', sans-serif", 
                  mt: 1,
                  color: theme.palette.text.primary
                }}>
                  {stat.value}
                </Typography>
                <Chip
                  label={`${stat.trend >= 0 ? '+' : ''}${stat.trend}%`}
                  size="small"
                  icon={stat.trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  sx={{
                    fontSize: '10px',
                    fontWeight: 600,
                    bgcolor: stat.trend >= 0 ? '#e6f4ea' : '#fee2e2',
                    color: stat.trend >= 0 ? '#15803d' : '#b91c1c',
                    borderRadius: '5px',
                    mt: 1,
                    width: 'fit-content',
                  }}
                />
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
            {statCards.map((stat, index) => (
              <Paper
                key={index}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  px: 2,
                  py: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
                elevation={0}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500, 
                    fontSize: '14px', 
                    fontFamily: "Inter",
                    color: theme.palette.text.secondary
                  }}>
                    {stat.title}
                  </Typography>
                  <Chip
                    label={`${stat.trend >= 0 ? '+' : ''}${stat.trend}%`}
                    size="small"
                    icon={stat.trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    sx={{
                      fontSize: '10px',
                      fontWeight: 600,
                      bgcolor: stat.trend >= 0 ? '#e6f4ea' : '#fee2e2',
                      color: stat.trend >= 0 ? '#15803d' : '#b91c1c',
                      borderRadius: '5px',
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500, 
                  fontSize: '36px', 
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.primary
                }}>
                  {stat.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Charts Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
        {/* Top Row - Revenue Growth and Member Growth side by side */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 3 
        }}>
          {/* Revenue Growth */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: '10px',
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }} elevation={0}>
            <Typography variant="h5" sx={{ 
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 3,
              fontFamily:'Inter'
            }}>
              Revenue Growth
            </Typography>
            <RevenueLineChart timeRange="30d" />
          </Paper>

          {/* Member Growth */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: '10px',
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }} elevation={0}>
            <Typography variant="h5" sx={{ 
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 3,
              fontFamily:'Inter'
            }}>
              Member Growth
            </Typography>
            <MemberGrowthChart timeRange="30d" />
          </Paper>
        </Box>

        {/* Bottom Row - Payment Status and Revenue by Plan side by side */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 3 
        }}>
          {/* Payment Status */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: '10px',
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }} elevation={0}>
            <Typography variant="h5" sx={{ 
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 3,
              fontFamily:'Inter'
            }}>
              Payment Status
            </Typography>
            <PaymentStatusChart />
          </Paper>

          {/* Revenue by Plan */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: '10px',
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
          }} elevation={0}>
            <Typography variant="h5" sx={{ 
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 3,
              fontFamily:'Inter'
            }}>
              Revenue by Plan
            </Typography>
            <RevenueByPlanChart />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics;