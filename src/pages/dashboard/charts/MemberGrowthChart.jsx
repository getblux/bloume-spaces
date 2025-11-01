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

const MemberGrowthChart = ({ timeRange = '30d' }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberGrowthData();
  }, [currentUser, timeRange]);

  const fetchMemberGrowthData = async () => {
    if (!currentUser) return;

    try {
      const membersQuery = query(
        collection(db, 'members'),
        where('communityId', '==', currentUser.uid),
        orderBy('joinDate', 'asc')
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate()
      }));

      const { growthData, labels, cumulativeData } = aggregateMemberGrowth(members, timeRange);
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'New Members',
            data: growthData,
            borderColor: theme.palette.secondary.main,
            backgroundColor: `rgba(${parseInt(theme.palette.secondary.main.slice(1, 3), 16)}, ${parseInt(theme.palette.secondary.main.slice(3, 5), 16)}, ${parseInt(theme.palette.secondary.main.slice(5, 7), 16)}, 0.1)`,
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Total Members',
            data: cumulativeData,
            borderColor: theme.palette.primary.main,
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            yAxisID: 'y1',
            pointStyle: false,
          }
        ],
      });
    } catch (error) {
      console.error('Error fetching member growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateMemberGrowth = (members, range) => {
    const now = new Date();
    let startDate = new Date();
    let interval = 'day';
    let labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        interval = 'week';
        labelFormat = (date) => `Week ${Math.ceil((date - startDate) / (7 * 24 * 60 * 60 * 1000))}`;
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Filter members within date range
    const filteredMembers = members.filter(member => 
      member.joinDate >= startDate && member.joinDate <= now
    );

    // Group members by time interval
    const dailyGrowth = {};
    filteredMembers.forEach(member => {
      let key;
      if (interval === 'day') {
        key = member.joinDate.toDateString();
      } else {
        const weekStart = new Date(member.joinDate);
        weekStart.setDate(member.joinDate.getDate() - member.joinDate.getDay());
        key = weekStart.toDateString();
      }
      
      if (!dailyGrowth[key]) {
        dailyGrowth[key] = 0;
      }
      dailyGrowth[key]++;
    });

    // Generate all intervals in the range
    const labels = [];
    const growthData = [];
    const cumulativeData = [];
    const current = new Date(startDate);
    let totalMembers = members.filter(m => m.joinDate < current).length;
    
    while (current <= now) {
      const key = interval === 'day' ? current.toDateString() : 
                  new Date(current.getFullYear(), current.getMonth(), current.getDate() - current.getDay()).toDateString();
      
      const newMembers = dailyGrowth[key] || 0;
      totalMembers += newMembers;
      
      labels.push(labelFormat(new Date(current)));
      growthData.push(newMembers);
      cumulativeData.push(totalMembers);
      
      if (interval === 'day') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }

    return { growthData, labels, cumulativeData };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter' },
          color: theme.palette.text.primary
        }
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
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          maxTicksLimit: 6,
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
        },
        title: {
          display: true,
          text: 'New Members',
          font: { family: 'Inter' },
          color: theme.palette.text.secondary
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
          text: 'Total Members',
          font: { family: 'Inter' },
          color: theme.palette.text.secondary
        }
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ height: 400, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading member growth data...
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
            No member data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MemberGrowthChart;