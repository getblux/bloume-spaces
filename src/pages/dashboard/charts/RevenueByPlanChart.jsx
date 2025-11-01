import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, useTheme, Typography } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueByPlanChart = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueByPlanData();
  }, [currentUser]);

  const fetchRevenueByPlanData = async () => {
    if (!currentUser) return;

    try {
      const membersQuery = query(
        collection(db, 'members'),
        where('communityId', '==', currentUser.uid),
        where('paymentAmount', '>', 0)
      );
      const membersSnapshot = await getDocs(membersQuery);

      // Group revenue by plan
      const planRevenue = {};
      const planMemberCount = {};

      membersSnapshot.forEach(doc => {
        const member = doc.data();
        const planName = member.selectedPlan || 'Community Plan';
        const amount = member.paymentAmount || 0;

        if (!planRevenue[planName]) {
          planRevenue[planName] = 0;
          planMemberCount[planName] = 0;
        }

        planRevenue[planName] += amount;
        planMemberCount[planName]++;
      });

      // Sort plans by revenue (descending)
      const sortedPlans = Object.keys(planRevenue).sort((a, b) => planRevenue[b] - planRevenue[a]);

      const labels = sortedPlans;
      const revenueData = sortedPlans.map(plan => planRevenue[plan]);
      const memberCountData = sortedPlans.map(plan => planMemberCount[plan]);

      // Generate colors based on theme
      const barColors = sortedPlans.map((_, index) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main
        ];
        return colors[index % colors.length];
      });

      setChartData({
        labels,
        datasets: [
          {
            label: 'Revenue (₦)',
            data: revenueData,
            backgroundColor: barColors,
            borderColor: barColors.map(color => color),
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Members',
            data: memberCountData,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
            type: 'line',
            yAxisID: 'y1',
            tension: 0.4,
            pointBackgroundColor: theme.palette.text.primary,
          }
        ],
      });
    } catch (error) {
      console.error('Error fetching revenue by plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: 'Inter',
            size: 12
          },
          usePointStyle: true,
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
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            if (label.includes('Revenue')) {
              return `${label}: ₦${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
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
          font: { family: 'Inter' },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
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
        title: {
          display: true,
          text: 'Revenue',
          color: theme.palette.text.secondary,
          font: { family: 'Inter' }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { family: 'Inter' },
        },
        title: {
          display: true,
          text: 'Members',
          color: theme.palette.text.secondary,
          font: { family: 'Inter' }
        }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  if (loading) {
    return (
      <Box sx={{ height: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading revenue by plan data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 300, width: '100%' }}>
      {chartData ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No revenue by plan data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RevenueByPlanChart;