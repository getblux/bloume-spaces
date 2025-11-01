import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Drawer,
  Fab,
  Checkbox,
  Menu,
  MenuItem,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  Select,
  Tooltip
} from '@mui/material';
import { 
  MagnifyingGlass, 
  PencilSimple, 
  Trash, 
  DotsThree, 
  X, 
  Plus, 
  Clock, 
  CheckCircle, 
  Package, 
  ShoppingCart, 
  XCircle 
} from 'phosphor-react';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  Timestamp, 
  getDoc 
} from 'firebase/firestore';
import { useTheme, useMediaQuery } from '@mui/material';
import { useOutletContext, useLocation } from 'react-router-dom';

const Customers = () => {
  const theme = useTheme();
  const auth = getAuth();
  const location = useLocation();
  const [userId, setUserId] = useState(auth.currentUser?.uid);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuCustomerId, setMenuCustomerId] = useState(null);

  // Handlers for menu
  const handleMenuOpen = (event, customerId) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuCustomerId(customerId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuCustomerId(null);
  };

  // State management
  const [customers, setCustomers] = useState([]);
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 24;
  const [searchTerm, setSearchTerm] = useState('');
const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);


  // Helper function to truncate address
  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    const words = address.split(' ');
    if (words.length > 6) {
      return words.slice(0, 6).join(' ') + '...';
    }
    return address;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setClientDetails({
      name: '',
      email: '',
      contact: '',
      address: '',
    });
    setIsEditing(false);
  };

  // Reset form when drawer closes
  useEffect(() => {
    if (!isCustomerFormOpen) {
      resetForm();
    }
  }, [isCustomerFormOpen]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
  
    try {
      const customersCollection = collection(db, 'users', userId, 'customers');
      const customerQuery = query(customersCollection, where("email", "==", clientDetails.email));
      const customerSnapshot = await getDocs(customerQuery);
  
      if (customerSnapshot.empty) {
        const newCustomer = {
          name: clientDetails.name,
          email: clientDetails.email,
          contact: clientDetails.contact,
          address: clientDetails.address,
          createdAt: Timestamp.now(),
        };
        await addDoc(customersCollection, newCustomer);
      } else {
        const customerDoc = customerSnapshot.docs[0];
        await updateDoc(customerDoc.ref, {
          name: clientDetails.name,
          contact: clientDetails.contact,
          address: clientDetails.address,
          updatedAt: Timestamp.now(),
        });
      }
  
      resetForm();
      setIsCustomerFormOpen(false);
      await fetchCustomers();
      
    } catch (error) {
      console.error('Error handling customer: ', error);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    if (!userId) return;
    setIsLoading(true);
  
    try {
      const customersRef = collection(db, 'users', userId, 'customers');
      const querySnapshot = await getDocs(customersRef);
      
      const customersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      setCustomers([...customersList]);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching customers: ', error);
      setIsLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (customer) => {
    setSelectedCustomerId(customer.id);
    setClientDetails({
      name: customer.name,
      email: customer.email,
      contact: customer.contact || '',
      address: customer.address || '',
    });
    setIsEditing(true);
    setIsCustomerFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!userId) return;
  
    try {
      const idsToDelete = Array.isArray(selectedCustomerId) 
        ? selectedCustomerId 
        : [selectedCustomerId];
  
      await Promise.all(
        idsToDelete.map(id => 
          deleteDoc(doc(db, 'users', userId, 'customers', id))
        )
      );
  
      const updatedCustomers = customers.filter(
        customer => !idsToDelete.includes(customer.id)
      );
      setCustomers(updatedCustomers);
      setSelectedCustomers([]);
      
    } catch (error) {
      console.error('Error deleting customers:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCustomerId(null);
    }
  };

  const toggleSelectAllCustomers = () => {
    if (selectedCustomers.length === currentCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(currentCustomers.map(c => c.id));
    }
  };
  
  const toggleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };
  
  const handleBulkDeleteCustomers = () => {
    setSelectedCustomerId(selectedCustomers);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCustomers();
    }
  }, [userId]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const getAvatarColor = (firstLetter) => {
    const colors = {
      'A-E': '#FFA500',
      'F-J': '#800080',
      'K-O': '#008000',
      'P-T': '#0000FF',
      'U-Z': '#ff6000'
    };
    if (/[A-E]/.test(firstLetter)) return colors['A-E'];
    if (/[F-J]/.test(firstLetter)) return colors['F-J'];
    if (/[K-O]/.test(firstLetter)) return colors['K-O'];
    if (/[P-T]/.test(firstLetter)) return colors['P-T'];
    if (/[U-Z]/.test(firstLetter)) return colors['U-Z'];
    return '#FFA500';
  };

  const renderCustomerTable = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
  
    return (
      <Box sx={{
        width: '100%',
        p: { xs: 1, sm: 0 },
        paddingTop: { xs: 0, sm: 6 },
        paddingBottom: { xs: 5, sm: 3 }
      }}>


{/* Header Section - Desktop Only */}
<Box sx={{ display: { xs: 'none', sm: 'block' }, mb: 1, mt: 0 }}>
  <Typography variant="h4" sx={{ 
    fontWeight: 600, 
    mb: 1,
    color: theme.palette.text.primary
  }}>
    Customers
  </Typography>
  <Typography variant="body1" sx={{ 
    color: theme.palette.text.secondary
  }}>
    Manage your customer database
  </Typography>
</Box>

{/* Search Bar Section */}
<Box sx={{
  mb: 2,
  mt: 7,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  {/* Search Field - Left */}
  <TextField
    placeholder="Search customers..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{
      flex: 1,
      maxWidth: '600px',
      '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        height: '56px',
      },
      '& .MuiOutlinedInput-input': {
        padding: '16.5px 14px',
      }
    }}
  />
  
{/* Add Customer Button - Right */}
<Button
  variant="contained"
  onClick={() => setIsCustomerFormOpen(true)}
  sx={{
    borderRadius: '8px',
    height: '50px',
    px: { xs: 0, sm: 2 },
    minWidth: { xs: '48px', sm: 'auto' },
    width: { xs: '48px', sm: 'auto' },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ml: { xs: 2, sm: 2 } // Add margin left on mobile only
  }}
>
  <Plus size={20} />
  <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>
    Add Customer
  </Box>
</Button>
</Box>

        <Box sx={{
  overflow: 'auto',
  '& table': {
    minWidth: '800px',
    backgroundColor: 'background.paper',
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    display: { xs: 'none', sm: 'table' },
  },
  '& th, & td': {
    margin: 0,
    padding: '8px 16px',
    verticalAlign: 'middle',
    textAlign: 'left',
    fontWeight: 500,
    fontSize: '15px',
    fontFamily: 'Inter',
    color: 'text.primary',
  }
}}>
  <TableContainer sx={{ 
    border: 'none',
    borderRadius: '12px',
    overflow: 'hidden',
    paddingBottom: '10px'
  }}>
    <Table sx={{ 
      borderCollapse: 'separate',
      borderSpacing: 0,
      '& .MuiTableRow-root': {
        border: 'none'
      },
      '& .MuiTableCell-root': {
        border: 'none',
        borderBottom: `0px solid ${theme.palette.mode === 'dark' ? '#444444' : '#e8e8e8'}`,
        '&:last-child': {
          borderRight: 'none'
        }
      }
    }}>
      <TableHead sx={{
        backgroundColor: 'background.level2',
      }}>
        <TableRow sx={{
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0'}`,
            '&:first-of-type': {
              borderBottomLeftRadius: '12px'
            },
            '&:last-of-type': {
              borderBottomRightRadius: '12px'
            }
          }
        }}>
          <TableCell sx={{ 
            width: '50px',
            borderTopLeftRadius: '12px'
          }}>
            <Checkbox
              checked={selectedCustomers.length === currentCustomers.length && currentCustomers.length > 0}
              indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < currentCustomers.length}
              onChange={toggleSelectAllCustomers}
            />
          </TableCell>
          <TableCell sx={{ width: '20%' }}>Customer</TableCell>
          <TableCell sx={{ width: '20%' }}>Email</TableCell>
          <TableCell sx={{ width: '15%' }}>Contact</TableCell>
          <TableCell sx={{ width: '20%' }}>Address</TableCell>
          <TableCell sx={{ width: '15%' }}>Created</TableCell>
          <TableCell sx={{ 
            width: '10%', 
            textAlign: 'right',
            borderTopRightRadius: '12px'
          }}>Action</TableCell>
        </TableRow>
      </TableHead>
      
      <TableBody>
        {/* Add spacing row */}
        <TableRow sx={{ height: '16px', '& td': { border: 'none', padding: 0, borderBottom: 'none' } }}>
          <TableCell colSpan={7} />
        </TableRow>

        {/* Bulk selection row */}
        {selectedCustomers.length > 0 && (
          <TableRow sx={{ 
            backgroundColor: 'background.default',
          }}>
            <TableCell colSpan={7} sx={{ 
              padding: '8px 16px',
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0'}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {selectedCustomers.length} selected
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'error.main',
                    borderRadius: '5px',
                    fontSize: '12px',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? '#7f1d1d' : '#dc2626'
                    }
                  }}
                  startIcon={<Trash size={16} />}
                  onClick={handleBulkDeleteCustomers}
                  size="small"
                >
                  Delete
                </Button>
              </Box>
            </TableCell>
          </TableRow>
        )}

        {/* Customer rows */}
        {currentCustomers.map((customer, index) => (
          <TableRow 
            key={customer.id} 
            sx={{
              '& td': { 
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#444444' : '#e8e8e8'}`,
                ...(index === currentCustomers.length - 1 && {
                  borderBottom: 'none'
                })
              }
            }}
          >
            <TableCell>
              <Checkbox
                checked={selectedCustomers.includes(customer.id)}
                onChange={() => toggleCustomerSelect(customer.id)}
                color="error"
              />
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: getAvatarColor(customer.name?.charAt(0).toUpperCase() || 'C'),
                  width: 32, 
                  height: 32 
                }}>
                  {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                  {customer.name}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {customer.email}
              </Typography>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>
              {customer.contact || 'N/A'}
            </TableCell>
            <TableCell>
              <Tooltip title={customer.address || 'N/A'} placement="top">
                <Typography 
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {truncateAddress(customer.address)}
                </Typography>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Typography sx={{ color: 'text.primary' }}>
                {customer.createdAt.toLocaleDateString()}
              </Typography>
            </TableCell>
            <TableCell sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={(event) => handleMenuOpen(event, customer.id)}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : 'rgba(0, 0, 0, 0.04)' 
                    }
                  }}
                >
                  <DotsThree size={18} color={theme.palette.text.primary} />
                </IconButton>
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl) && menuCustomerId === customer.id}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: { 
                      minWidth: 120, 
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'background.paper',
                      color: 'text.primary'
                    }
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleEdit(customer);
                      handleMenuClose();
                    }}
                    sx={{ 
                      fontSize: '14px', 
                      fontFamily: 'Inter',
                      color: 'text.primary',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'
                      }
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setIsDeleteDialogOpen(true);
                      handleMenuClose();
                    }}
                    sx={{ 
                      fontSize: '14px', 
                      fontFamily: 'Inter', 
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#3a1a1a' : '#fdecea'
                      }
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Box>
  
        {/* Mobile Cards */}
        <Box sx={{
          display: { xs: 'block', sm: 'none' },
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          border: 'none',
          mt: 0,
          overflow: 'hidden'
        }}>
          {currentCustomers.map((customer) => (
            <Box 
              key={customer.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'start', 
                gap: 2, 
                py: 2,
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'}`,
                backgroundColor: theme.palette.background.paper
              }}
            >
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '999px',
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'
              }}>
                <Avatar
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: getAvatarColor(customer.name?.charAt(0).toUpperCase() || 'C'),
                    borderRadius: '999px',
                  }}
                >
                  {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{
                      fontWeight: 600,
                      fontSize: '13px',
                      lineHeight: '120%',
                      mb: 0.5,
                      fontFamily: 'Overused Grotesk',
                      width: '100%',
                      color: theme.palette.text.primary
                    }}
                  >
                    {customer.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 400, 
                        fontSize: '13px',
                        color: theme.palette.text.primary
                      }}
                    >
                      {customer.email}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: theme.palette.text.secondary
                    }}
                  >
                    {customer.contact || 'No contact'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    sx={{
                      borderRadius: '5px',
                      bgcolor: theme.palette.background.default,
                      border: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#f1f1f1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { 
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'rgba(0, 0, 0, 0.04)' 
                      }
                    }}
                  >
                    <PencilSimple size={16} color={theme.palette.text.primary} onClick={() => handleEdit(customer)} />
                    <Box sx={{ width: '1px', height: '16px', bgcolor: theme.palette.mode === 'dark' ? '#333333' : 'rgba(0, 0, 0, 0.2)' }} />
                    <Trash size={16} color={theme.palette.error.main} onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setIsDeleteDialogOpen(true);
                    }} />
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{
      width: '100%',
      p: 1,
      paddingTop: 0,
      paddingBottom: 5
    }}>
      {/* Quick Stats - Hidden */}
      <Grid container spacing={3} mb={4} sx={{ display: 'none' }}>
      </Grid>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : customers.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '20px', sm: '20px', md: '24px' }, letterSpacing: '-0.5px' }}>
            No Customers Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '15px', sm: '16px', md: '18px' }, mb: 4 }}>
            Start by adding your first customer.
          </Typography>
         
        </Box>
      ) : (
        <>


          <Box sx={{
            width: '100%',
            mt: 1,
            backgroundColor: { xs: 'transparent', sm: 'transparent' },
            overflow: 'auto',
            '&::-webkit-scrollbar': { height: '6px', width: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#c1c1c1', borderRadius: '3px' }
          }}>
            {renderCustomerTable()}
          </Box>

          {filteredCustomers.length > customersPerPage && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 4,
              width: '100%',
              pb: { xs: 2, sm: 0 }
            }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isSmallScreen ? 'small' : 'large'}
              />
            </Box>
          )}
        </>
      )}

      {isCustomerFormOpen && (
        <>
          <Drawer
            anchor="right"
            open={isCustomerFormOpen}
            onClose={() => setIsCustomerFormOpen(false)}
            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }
            }}
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 500, md: 550, lg: 650 },
                maxWidth: '100%',
                height: '100%',
                overflowY: 'auto',
                position: 'fixed',
                top: 0,
                boxSizing: 'border-box',
                backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff',
                paddingBottom: { xs: 'env(safe-area-inset-bottom, 0px)', sm: 0 }
              }
            }}
          >
            <Box sx={{ width: '100%', p: 3, pb: 10, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="superbody"
                  sx={{ fontSize: { xs: '20px', md: '22px' }, fontWeight: 600, letterSpacing: '-0.5px' }}
                >
                  {isEditing ? 'Edit Customer' : 'Add your customer'}
                </Typography>
                {isMobile && (
                  <IconButton onClick={() => setIsCustomerFormOpen(false)}>
                    <XCircle size={24} />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body2" sx={{ mb: 3, fontSize: '14px', color: 'text.secondary' }}>
                {isEditing ? 'Modify the customer details' : 'Create a new customer for your shop'}
              </Typography>

              <form onSubmit={handleSubmit} style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                paddingBottom: { xs: '80px', sm: '60px' }
              }}>
               <Box sx={{ flex: 1 }}>
  {/* Customer Name */}
  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Name
  </Typography>
  <TextField
    name="name"
    value={clientDetails.name}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />
 

  {/* Customer Email */}
  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Email
  </Typography>
  <TextField
    name="email"
    value={clientDetails.email}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />


  {/* Phone Number */}
  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
    Phone Number
  </Typography>
  <TextField
    name="contact"
    value={clientDetails.contact}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />


  {/* Customer Address */}
  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Address
  </Typography>
  <TextField
    name="address"
    value={clientDetails.address}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />
</Box>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    fontSize: '16px',
                    fontWeight: 600,
                    '&:hover': { 
                      bgcolor: theme.palette.primary.dark 
                    },
                    mb: 5
                  }}
                >
                  {isEditing ? 'Update Customer' : 'Add Customer'}
                </Button>
              </form>
            </Box>
          </Drawer>
        </>
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px' }}>
          Delete Customer
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this customer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;