import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useTheme,
  useMediaQuery,
  styled,
  Fab,
  Drawer,
  MenuItem
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc   } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { PlusCircle, MinusCircle, Copy, Play, DotsThree } from '@phosphor-icons/react';
import { Edit, Delete } from '@mui/icons-material';
import { Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  borderRadius: '10px',
  marginBottom: theme.spacing(2),
}));



const Audience = () => {
  const [members, setMembers] = useState([]);
  const [community, setCommunity] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    selectedPlan: '',
    paymentAmount: '',
    paymentStatus: 'active',
    accessType: 'one-time'
  });
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Replace the hardcoded PLANS with dynamic plans based on community
const PLANS = community ? [
  { name: 'Community', amount: community.price || 0 },
  { name: 'Custom Amount', amount: 0 }
] : [];


// Add this useEffect to fetch community data
useEffect(() => {
  fetchCommunity();
}, [currentUser]);

const fetchCommunity = async () => {
  if (!currentUser) return;
  try {
    const communityDoc = await getDoc(doc(db, 'communities', currentUser.uid));
    if (communityDoc.exists()) {
      setCommunity(communityDoc.data());
    }
  } catch (error) {
    console.error('Error fetching community:', error);
  }
};

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchMembers();
  }, [currentUser]);

  const fetchMembers = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'members'), where('communityId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handlePlanChange = (planName) => {
    const selectedPlan = PLANS.find(plan => plan.name === planName);
    setNewMember({
      ...newMember,
      selectedPlan: planName,
      paymentAmount: selectedPlan.amount === 0 ? '' : selectedPlan.amount
    });
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in name and email');
      return;
    }
  
    const paymentAmount = newMember.paymentAmount || community?.price || 0;
    
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
  
    setLoading(true);
    try {
      await addDoc(collection(db, 'members'), {
        communityId: currentUser.uid,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        selectedPlan: newMember.selectedPlan || 'Community',
        paymentAmount: parseInt(paymentAmount),
        paymentStatus: newMember.paymentStatus,
        accessType: newMember.accessType,
        joinDate: new Date(),
        addedManually: true
      });
  
      // ADD THIS: Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        type: 'new_member',
        message: `${newMember.name} joined your community`,
        isRead: false,
        createdAt: new Date()
      });
  
      setDialogOpen(false);
      setNewMember({ 
        name: '', 
        email: '', 
        phone: '', 
        selectedPlan: '', 
        paymentAmount: '',
        paymentStatus: 'active',
        accessType: 'one-time'
      });
      fetchMembers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember?.name || !editingMember?.email) {
      toast.error('Please fill in name and email');
      return;
    }
  
    setLoading(true);
    try {
      await updateDoc(doc(db, 'members', editingMember.id), {
        name: editingMember.name,
        email: editingMember.email,
        phone: editingMember.phone,
        selectedPlan: editingMember.selectedPlan,
        paymentAmount: parseInt(editingMember.paymentAmount) || 0,
        paymentStatus: editingMember.paymentStatus,
        accessType: editingMember.accessType
      });
  
     
      setEditDialogOpen(false);
      setEditingMember(null);
      fetchMembers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'members', deletingMember.id));
      setDeleteDialogOpen(false);
      setDeletingMember(null);
      fetchMembers();
      toast.success('Member deleted successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete member');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{
      width: '100%',
      p: 1,
      paddingTop: 0,
      paddingBottom: 5
    }}>

      <Box sx={{ mb: 6, mt: 2 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: { xs: '24px', sm: '28px' },
            mb: 1
          }}
        >
          Audience
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '16px'
          }}
        >
          Manage and view all members of your community
        </Typography>
      </Box>

      {members.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 400, fontSize: { xs: '20px', sm: '20px', md: '24px' }, letterSpacing: '0px' }}>
            No Members Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '15px', sm: '16px', md: '18px' }, mb: 4 }}>
            Start by adding your first member or share your page to get members.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: '8px' }}
          >
            Add Member
          </Button>
        </Box>
      ) : (
        <StyledCard>
          <TableContainer sx={{ 
            border: 'none',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>

            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <TextField
                fullWidth
                placeholder="Search members by name, email, or phone..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: '6px',
                  }
                }}
              />
            </Box>

            <Table sx={{ 
              borderCollapse: 'separate',
              borderSpacing: 0,
              '& .MuiTableRow-root': {
                border: 'none'
              },
              '& .MuiTableCell-root': {
                border: 'none'
              },
              display: { xs: 'none', sm: 'table' }
            }}>
            <TableHead sx={{
  backgroundColor: theme.palette.background.default,
}}>
  <TableRow sx={{ '& th': { borderBottom: 'none' } }}>
    <TableCell style={{ width: '25%' }}>Name</TableCell>
    <TableCell style={{ width: '25%' }}>Email</TableCell>
    <TableCell style={{ width: '15%' }}>Phone</TableCell>
    <TableCell style={{ width: '15%' }}>Plan</TableCell>
    <TableCell style={{ width: '10%' }}>Amount</TableCell>
    <TableCell style={{ width: '10%' }}>Status</TableCell>
    <TableCell style={{ width: '5%' }}>Actions</TableCell>
  </TableRow>
</TableHead>

<TableBody>
  {filteredMembers.map((member) => (
    <TableRow 
      key={member.id} 
      hover
      sx={{
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9'
        },
        '& td': { 
          border: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`
        },
        '&:last-child td': {
          borderBottom: 'none'
        }
      }}
    >
      <TableCell>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 500, 
            fontFamily: 'Inter', 
            fontSize: '14px',
            color: theme.palette.text.primary
          }}
        >
          {member.name}
        </Typography>
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.secondary }}>
        {member.email}
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.secondary }}>
        {member.phone || '-'}
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.secondary }}>
        {member.selectedPlan || '-'}
      </TableCell>
      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
        {member.paymentAmount ? `₦${member.paymentAmount.toLocaleString()}` : '-'}
      </TableCell>
      <TableCell>
        <Chip
          label={member.paymentStatus}
          color={getStatusColor(member.paymentStatus)}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => {
              setEditingMember(member);
              setEditDialogOpen(true);
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => {
              setDeletingMember(member);
              setDeleteDialogOpen(true);
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards */}
          <Box sx={{
            display: { xs: 'block', sm: 'none' },
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            border: 'none',
            overflow: 'hidden'
          }}>
            {filteredMembers.map((member) => (
              <Box 
                key={member.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'start', 
                  gap: 2, 
                  py: 2,
                  px: 2,
                  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'}`,
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{
                      fontWeight: 600,
                      fontSize: '13px',
                      lineHeight: '120%',
                      mb: 0.5,
                      color: theme.palette.text.primary
                    }}
                  >
                    {member.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 400, 
                      fontSize: '13px',
                      color: theme.palette.text.secondary,
                      mb: 0.5
                    }}
                  >
                    {member.email}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      fontSize: '13px',
                      color: theme.palette.text.primary,
                      mb: 1
                    }}
                  >
                    {member.selectedPlan} • ₦{member.paymentAmount?.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={member.paymentStatus}
                      color={getStatusColor(member.paymentStatus)}
                      size="small"
                      sx={{ fontWeight: 500, height: 20 }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setEditingMember(member);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setDeletingMember(member);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash size={16} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </StyledCard>
      )}

      {/* Add Member Drawer */}
      <Drawer
  anchor="right"
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  sx={{
    '& .MuiDrawer-paper': {
      width: { xs: '100%', sm: 400, md:550 },
      backgroundColor: theme.palette.background.paper,
      borderTopLeftRadius: '0px',
      borderBottomLeftRadius: '0px',
    },
  }}
>
  <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Add New Member</Typography>
      <IconButton onClick={() => setDialogOpen(false)} size="small">
        <Close />
      </IconButton>
    </Box>
    
    <Box sx={{ flex: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
          Full Name
        </Typography>
        <TextField
          variant="filled"
          fullWidth
       
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
          Email Address
        </Typography>
        <TextField
          variant="filled"
          fullWidth
         
          value={newMember.email}
          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
          Phone Number
        </Typography>
        <TextField
          variant="filled"
          fullWidth
         
          value={newMember.phone}
          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
          Select Plan
        </Typography>
        <TextField
          variant="filled"
          fullWidth
          select
          value={newMember.selectedPlan}
          onChange={(e) => handlePlanChange(e.target.value)}
        >
          <MenuItem value="">Choose a plan</MenuItem>
          {PLANS.map((plan) => (
            <MenuItem key={plan.name} value={plan.name}>
              {plan.name} {plan.amount > 0 ? `- ₦${plan.amount.toLocaleString()}` : ''}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {newMember.selectedPlan === 'Custom Amount' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
            Custom Amount (NGN)
          </Typography>
          <TextField
            variant="filled"
            fullWidth
           
            type="number"
            value={newMember.paymentAmount}
            onChange={(e) => setNewMember({ ...newMember, paymentAmount: e.target.value })}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
            Payment Status
          </Typography>
          <TextField
            variant="filled"
            fullWidth
            select
            value={newMember.paymentStatus}
            onChange={(e) => setNewMember({ ...newMember, paymentStatus: e.target.value })}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </TextField>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, fontFamily:'Instrument Sans' }}>
            Access Type
          </Typography>
          <TextField
  variant="filled"
  fullWidth
  select
  value="one-time"
  disabled
>
  <MenuItem value="one-time">One-time</MenuItem>
</TextField>
        </Box>
      </Box>
    </Box>
    
    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
      <Button 
        fullWidth 
        variant="outlined" 
        onClick={() => setDialogOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        fullWidth 
        variant="contained" 
        onClick={handleAddMember} 
        disabled={loading}
      >
        {loading ? 'Adding Member...' : 'Add Member'}
      </Button>
    </Box>
  </Box>
</Drawer>

     {/* Edit Member Drawer */}
<Drawer
  anchor="right"
  open={editDialogOpen}
  onClose={() => setEditDialogOpen(false)}
  sx={{
    '& .MuiDrawer-paper': {
      width: { xs: '100%', sm: 400 },
      backgroundColor: theme.palette.background.paper,
      borderTopLeftRadius: '0px',
      borderBottomLeftRadius: '0px',
    },
  }}
>
  <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Edit Member</Typography>
      <IconButton onClick={() => setEditDialogOpen(false)} size="small">
        <Close />
      </IconButton>
    </Box>
    
    <Box sx={{ flex: 1 }}>
      <TextField
        fullWidth
  
        value={editingMember?.name || ''}
        onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
        margin="normal"
      />
      <TextField
        fullWidth
     
        value={editingMember?.email || ''}
        onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
        margin="normal"
      />
      <TextField
        fullWidth
       
        value={editingMember?.phone || ''}
        onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
        margin="normal"
      />

      {/* Add Plan Selection to Edit Drawer */}
      <TextField
        fullWidth
        select
        label="Select Plan"
        value={editingMember?.selectedPlan || ''}
        onChange={(e) => {
          const selectedPlan = PLANS.find(plan => plan.name === e.target.value);
          setEditingMember({ 
            ...editingMember, 
            selectedPlan: e.target.value,
            paymentAmount: selectedPlan?.amount === 0 ? editingMember?.paymentAmount : selectedPlan?.amount
          });
        }}
        margin="normal"
        SelectProps={{ native: true }}
      >
        <option value="">Choose a plan</option>
        {PLANS.map((plan) => (
          <option key={plan.name} value={plan.name}>
            {plan.name} {plan.amount > 0 ? `- ₦${plan.amount.toLocaleString()}` : ''}
          </option>
        ))}
      </TextField>

      {/* Show custom amount field only if Custom Amount is selected */}
      {editingMember?.selectedPlan === 'Custom Amount' && (
        <TextField
          fullWidth
         
          type="number"
          value={editingMember?.paymentAmount || ''}
          onChange={(e) => setEditingMember({ ...editingMember, paymentAmount: parseInt(e.target.value) || 0 })}
          margin="normal"
        />
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          fullWidth
          select
          label="Payment Status"
          value={editingMember?.paymentStatus || 'active'}
          onChange={(e) => setEditingMember({ ...editingMember, paymentStatus: e.target.value })}
          SelectProps={{ native: true }}
        >
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="refunded">Refunded</option>
        </TextField>
        <TextField
          fullWidth
          select
          label="Access Type"
          value={editingMember?.accessType || 'one-time'}
          onChange={(e) => setEditingMember({ ...editingMember, accessType: e.target.value })}
          SelectProps={{ native: true }}
        >
          <option value="one-time">One-time</option>
          <option value="recurring">Recurring</option>
        </TextField>
      </Box>
    </Box>
    
    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
      <Button 
        fullWidth 
        variant="outlined" 
        onClick={() => setEditDialogOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        fullWidth 
        variant="contained" 
        onClick={handleEditMember} 
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Update Member'}
      </Button>
    </Box>
  </Box>
</Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Delete Member</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deletingMember?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteMember} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Member'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 76,
          right: 36,
          display: { xs: 'flex', sm: members.length === 0 ? 'none' : 'flex' }
        }}
      >
        <Add />
      </Fab>

    </Box>
  );
};

export default Audience;