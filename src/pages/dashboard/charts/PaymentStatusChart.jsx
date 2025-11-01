import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, useTheme, Typography } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const PaymentStatusChart = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStatusData();
  }, [currentUser]);

  const fetchPaymentStatusData = async () => {
    if (!currentUser) return;

    try {
      const membersQuery = query(
        collection(db, 'members'),
        where('communityId', '==', currentUser.uid)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // Count members by payment status
      const statusCounts = {
        active: 0,
        expired: 0,
        refunded: 0
      };

      membersSnapshot.forEach(doc => {
        const member = doc.data();
        const status = member.paymentStatus?.toLowerCase() || 'active';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        } else {
          statusCounts.active++; // Default to active if unknown status
        }
      });

      const statusColors = {
        active: '#0FAA46', // Green
        expired: '#FF9800', // Orange
        refunded: '#EF4444' // Red
      };

      const statusLabels = {
        active: 'Active',
        expired: 'Expired', 
        refunded: 'Refunded'
      };

      const labels = Object.keys(statusCounts).map(key => statusLabels[key]);
      const data = Object.keys(statusCounts).map(key => statusCounts[key]);
      const backgroundColors = Object.keys(statusCounts).map(key => statusColors[key]);

      setChartData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderColor: theme.palette.background.paper,
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching payment status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: theme.palette.text.primary,
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <Box sx={{ height: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading payment status data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      {chartData ? (
        <Doughnut data={chartData} options={options} />
      ) : (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No payment status data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PaymentStatusChart;