import React, { useState, useEffect } from 'react';
import {
  Line
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Box, useTheme, Typography } from '@mui/material';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueLineChart = ({ timeRange = '30d' }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [currentUser, timeRange]);

  const fetchRevenueData = async () => {
    if (!currentUser) return;
  
    try {
      // Fetch automatic payments from payments collection
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('communityId', '==', currentUser.uid),
        orderBy('date', 'asc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      // Fetch manual payments from members collection
      const membersQuery = query(
        collection(db, 'members'),
        where('communityId', '==', currentUser.uid),
        where('paymentAmount', '>', 0)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // Process automatic payments
      const automaticPayments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        type: 'automatic'
      })).filter(payment => payment.status === 'success');

      // Process manual payments from members
      const manualPayments = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().joinDate?.toDate(),
        amount: doc.data().paymentAmount,
        type: 'manual'
      })).filter(member => member.amount > 0);

      // Combine both payment types
      const allPayments = [...automaticPayments, ...manualPayments];

      const { aggregatedData, labels } = aggregateRevenueData(allPayments, timeRange);
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: aggregatedData,
            borderColor: theme.palette.primary.main,
            backgroundColor: `rgba(${parseInt(theme.palette.primary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.primary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.1)`,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: theme.palette.primary.main,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateRevenueData = (payments, range) => {
    const now = new Date();
    let startDate = new Date();
    let interval = 'day';
    let labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        interval = 'week';
        labelFormat = (date) => `Week ${Math.ceil((date - startDate) / (7 * 24 * 60 * 60 * 1000))}`;
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Filter payments within date range
    const filteredPayments = payments.filter(payment => {
      if (!payment.date) return false;
      const inRange = payment.date >= startDate && payment.date <= endOfDay;
      return inRange;
    });

    // Group payments by time interval
    const aggregated = {};
    filteredPayments.forEach(payment => {
      let key;
      if (interval === 'day') {
        key = payment.date.toDateString();
      } else {
        const weekStart = new Date(payment.date);
        weekStart.setDate(payment.date.getDate() - payment.date.getDay());
        key = weekStart.toDateString();
      }
      
      if (!aggregated[key]) {
        aggregated[key] = 0;
      }
      aggregated[key] += payment.amount;
    });

    // Generate all intervals in the range
    const labels = [];
    const data = [];
    const current = new Date(startDate);
    
    while (current <= endOfDay) {
      const key = interval === 'day' ? current.toDateString() : 
                  new Date(current.getFullYear(), current.getMonth(), current.getDate() - current.getDay()).toDateString();
      
      labels.push(labelFormat(new Date(current)));
      data.push(aggregated[key] || 0);
      
      if (interval === 'day') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }

    return { aggregatedData: data, labels };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: function(context) {
            return `Revenue: ₦${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxTicksLimit: 6,
          font: { family: 'Inter' },
        },
      },
      y: {
        grid: {
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { family: 'Inter' },
          callback: function(value) {
            return `₦${value.toLocaleString()}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (loading) {
    return (
      <Box sx={{ height: 400, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading revenue data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      {chartData ? (
        <Line data={chartData} options={options} />
      ) : (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No revenue data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RevenueLineChart;