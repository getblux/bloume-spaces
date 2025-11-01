import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip
} from '@mui/material';
import {
  PersonAdd,
  Payment,
  AccountBalance,
  Info,
  Delete
} from '@mui/icons-material';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { 
  Person,
  Trash 
} from '@phosphor-icons/react';

dayjs.extend(relativeTime);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      notificationsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setNotifications(notificationsData);

      notificationsData.forEach(async (notification) => {
        if (!notification.isRead) {
          await updateDoc(doc(db, 'notifications', notification.id), {
            isRead: true
          });
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDelete = async (id) => {
    console.log('Delete clicked for:', id); // Add this
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_member':
        return <PersonAdd color="primary" />;
      case 'payment':
        return <Payment color="success" />;
      case 'payout':
        return <AccountBalance color="info" />;
      default:
        return <Info />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Notifications
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Stay updated with your community activity
      </Typography>

      <Paper sx={{
  bgcolor: 'background.default',
  border: `1px solid rgba(0, 0, 0, 0.07)`,
  boxShadow:'none'
}}>
  {notifications.length === 0 ? (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No notifications yet
      </Typography>
    </Box>
  ) : (
    <List>
      {notifications.map((notification, index) => (
     <ListItem
     key={notification.id}
     divider={index < notifications.length - 1}
     secondaryAction={
      <IconButton
      edge="end"
      onClick={() => handleDelete(notification.id)}
      sx={{ color: 'error.main' }}
    >
      <Trash size={20} weight="fill" />
    </IconButton>
     }
     sx={{
       bgcolor: 'transparent',
       '&:hover': {
         bgcolor: 'transparent'
       }
     }}
   >
     <ListItemIcon>
       <Person size={22} />
     </ListItemIcon>
     <ListItemText
       primary={
         <Typography variant="body1">
           {notification.message} {notification.createdAt?.toDate 
             ? dayjs(notification.createdAt.toDate()).fromNow()
             : 'Just now'
           }
         </Typography>
       }
     />
     {!notification.isRead && (
       <Chip label="New" color="primary" size="small" sx={{ ml: 2 }} />
     )}
   </ListItem>
      ))}
    </List>
  )}
</Paper>
    </Box>
  );
};

export default Notifications;
