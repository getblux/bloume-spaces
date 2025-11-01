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
  Select
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

const Orders = () => {
  const theme = useTheme();
  const auth = getAuth();
  const location = useLocation();
  const [userId, setUserId] = useState(auth.currentUser?.uid);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuOrderId, setMenuOrderId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);


// Add these handlers
const handleMenuOpen = (event, orderId) => {
  setMenuAnchorEl(event.currentTarget);
  setMenuOrderId(orderId);
};

const handleMenuClose = () => {
  setMenuAnchorEl(null);
  setMenuOrderId(null);
};

  // State management
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    alternateContact: '',
    products: [],
    quantities: {},
    totalPrice: 0,
    shippingAddress: '',
    orderNumber: '',
    status: 'Pending'
  });

  const generateOrderNumber = () => {
    return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const [products, setProducts] = useState([]);
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState('₦');
 
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 24;
  const [searchTerm, setSearchTerm] = useState('');
const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);

  // Add this useEffect to show search/plus icons when orders page loads
  useEffect(() => {
    if (location.pathname === '/dashboard/orders') {
      setSearchTerm(''); // Reset search term
      // The parent Dashboard component will handle showing the icons
    }
  }, [location.pathname, setSearchTerm]);

  // Status options
  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const addProduct = (product) => {
    if (!orderDetails.products.find(p => p.id === product.id)) {
      const newQuantities = { ...orderDetails.quantities, [product.id]: 1 };
      setOrderDetails(prev => ({
        ...prev,
        products: [...prev.products, product],
        quantities: newQuantities,
        totalPrice: [...prev.products, product].reduce((sum, p) => 
          sum + (p.price * (newQuantities[p.id] || 1)), 0)
      }));
    }
    setProductSearch('');
    setShowSuggestions(false);
  };

  const removeProduct = (productId) => {
    const newProducts = orderDetails.products.filter(p => p.id !== productId);
    const newQuantities = { ...orderDetails.quantities };
    delete newQuantities[productId];
    setOrderDetails(prev => ({
      ...prev,
      products: newProducts,
      quantities: newQuantities,
      totalPrice: newProducts.reduce((sum, p) => 
        sum + (p.price * (newQuantities[p.id] || 1)), 0)
    }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      e.preventDefault();
      addProduct(filteredProducts[0]);
    }
  };

  const handleSearchChange = (e) => {
    setProductSearch(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setOrderDetails({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      alternateContact: '',
      products: [],
      quantities: {},
      totalPrice: 0,
      shippingAddress: '',
    });
    setIsEditing(false);
    setProductSearch('');
    setShowSuggestions(false);
  };

  // Add this useEffect to reset form when drawer closes
useEffect(() => {
  if (!isOrderFormOpen) {
    resetForm();
  }
}, [isOrderFormOpen]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
  
    try {
      const ordersCollection = collection(db, 'users', userId, 'orders');
      const customersCollection = collection(db, 'users', userId, 'customers');
  
      // Check if customer already exists
      const customerQuery = query(customersCollection, where("email", "==", orderDetails.customerEmail));
      const customerSnapshot = await getDocs(customerQuery);
  
      let customerId;
      if (customerSnapshot.empty) {
        // Add new customer
        const newCustomer = {
          name: orderDetails.customerName,
          email: orderDetails.customerEmail,
          contact: orderDetails.customerPhone,
          address: orderDetails.customerAddress,
          alternateContact: orderDetails.alternateContact,
          createdAt: Timestamp.now(),
        };
        const customerRef = await addDoc(customersCollection, newCustomer);
        customerId = customerRef.id;
      } else {
        // Update existing customer
        const customerDoc = customerSnapshot.docs[0];
        customerId = customerDoc.id;
        await updateDoc(customerDoc.ref, {
          name: orderDetails.customerName,
          contact: orderDetails.customerPhone,
          address: orderDetails.customerAddress,
          alternateContact: orderDetails.alternateContact,
          updatedAt: Timestamp.now(),
        });
      }
  
      // Prepare order items
      const orderItems = orderDetails.products.map(product => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: orderDetails.quantities[product.id] || 1
      }));
  
      if (isEditing && selectedOrderId) {
        const orderDoc = await getDoc(doc(db, 'users', userId, 'orders', selectedOrderId));
        const existingOrder = orderDoc.data();
        await updateDoc(doc(db, 'users', userId, 'orders', selectedOrderId), {
          customerName: orderDetails.customerName,
          customerEmail: orderDetails.customerEmail,
          customerPhone: orderDetails.customerPhone,
          customerAddress: orderDetails.customerAddress,
          alternateContact: orderDetails.alternateContact,
          shippingAddress: orderDetails.shippingAddress,
          items: orderItems,
          totalPrice: orderDetails.totalPrice,
          status: orderDetails.status || 'Pending',
          orderNumber: existingOrder?.orderNumber || generateOrderNumber(),
          updatedAt: Timestamp.now(),
        });
      } else {
        const newOrder = {
          customerName: orderDetails.customerName,
          customerEmail: orderDetails.customerEmail,
          customerPhone: orderDetails.customerPhone,
          customerAddress: orderDetails.customerAddress,
          alternateContact: orderDetails.alternateContact,
          shippingAddress: orderDetails.shippingAddress,
          items: orderItems,
          totalPrice: orderDetails.totalPrice,
          status: 'Pending',
          date: Timestamp.now(),
          customerId: customerId,
          orderNumber: generateOrderNumber(), // Ensure this is added
        };
        await addDoc(ordersCollection, newOrder);
      }
  
      // Reset and close
      resetForm();
      setIsOrderFormOpen(false);
      await fetchOrders();
      
    } catch (error) {
      console.error('Error handling order: ', error);
    }
  };

  const fetchOrders = async () => {
    if (!userId) return;
    setIsLoading(true);
  
    try {
      const ordersRef = collection(db, 'users', userId, 'orders');
      const querySnapshot = await getDocs(ordersRef);
      
      // Fetch all products first
      const productsRef = collection(db, 'users', userId, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        images: doc.data().images || []
      }));
      
      setProducts(productsList);
  
      const ordersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        // Enhance order items with product images
        const itemsWithImages = data.items?.map(item => {
          const product = productsList.find(p => p.id === item.productId);
          return {
            ...item,
            image: product?.images?.[0] || ''
          };
        }) || [];
  
        const productNames = itemsWithImages.map(item => item.name).join(', ') || 'Multiple Products';
        const totalQuantity = itemsWithImages.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1;
        const price = data.totalPrice || 0;
        
        return {
          id: doc.id,
          ...data,
          items: itemsWithImages,
          product: productNames,
          quantity: totalQuantity,
          price: price,
          date: data.date?.toDate() || new Date()
        };
      });
      
      setOrders([...ordersList]);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching orders: ', error);
      setIsLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (order) => {
    setSelectedOrderId(order.id);
    
    const productsList = order.items?.map(item => {
      const product = products.find(p => p.id === item.productId) || {
        id: item.productId,
        name: item.name,
        price: item.price
      };
      return product;
    }) || [];
  
    const quantities = order.items?.reduce((acc, item) => ({
      ...acc,
      [item.productId]: item.quantity
    }), {}) || {};
  
    setOrderDetails({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || '',
      customerAddress: order.customerAddress || '',
      alternateContact: order.alternateContact || '',
      products: productsList,
      quantities: quantities,
      totalPrice: order.totalPrice || 0,
      shippingAddress: order.shippingAddress || '',
      status: order.status || 'Pending'
    });
    
    setIsEditing(true);
    setIsOrderFormOpen(true);
  };

  // Handle status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!userId) return;

    try {
      const orderRef = doc(db, 'users', userId, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order
        )
      );
    } catch (error) {
      console.error('Error updating status: ', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!userId) return;
  
    try {
      const idsToDelete = Array.isArray(selectedOrderId) 
        ? selectedOrderId 
        : [selectedOrderId];
  
      await Promise.all(
        idsToDelete.map(id => 
          deleteDoc(doc(db, 'users', userId, 'orders', id))
        )
      );
  
      const updatedOrders = orders.filter(
        order => !idsToDelete.includes(order.id)
      );
      setOrders(updatedOrders);
      setSelectedOrders([]);
      
    } catch (error) {
      console.error('Error deleting orders:', error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map(o => o.id));
    }
  };
  
  const toggleOrderSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  const handleBulkDeleteOrders = () => {
    setSelectedOrderId(selectedOrders);
    setIsDeleteDialogOpen(true);
  };

  // Get status color for chip
  const getStatusColor = (status) => {
    const colors = {
      Pending: '#D32F2F',
      Processing: '#ED6C02',
      Shipped: '#1976D2',
      Delivered: '#2E7D32',
      Cancelled: '#D32F2F',
    };
    return colors[status] || '#666666';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle size={16} />;
      case 'Processing': return <Clock size={16} />;
      case 'Pending': return <Clock size={16} />;
      case 'Shipped': return <Package size={16} />;
      default: return <ShoppingCart size={16} />;
    }
  };

  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!userId) return;
      
      try {
        const storeDetailsRef = doc(db, `users/${userId}/store/storeDetails`);
        const storeDetailsSnap = await getDoc(storeDetailsRef);
  
        if (storeDetailsSnap.exists()) {
          const { currency } = storeDetailsSnap.data();
          const currencySymbols = {
            USD: "$",
            EUR: "€", 
            GBP: "£",
            NGN: "₦",
            JPY: "¥",
            AUD: "$",
            CAD: "$",
            CHF: "Fr.",
            CNY: "¥"
          };
          setCurrencySymbol(currencySymbols[currency] || "₦");
        }
      } catch (error) {
        console.error("Error fetching currency:", error);
      }
    };
  
    fetchStoreDetails();
  }, [userId]);
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const filteredOrders = orders.filter((order) =>
    order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate order stats
  const orderStats = [
    { 
      title: 'Total Orders', 
      value: orders.length.toString(), 
      icon: ShoppingCart, 
      color: 'primary' 
    },
    { 
      title: 'Pending', 
      value: orders.filter(o => o.status === 'Pending').length.toString(), 
      icon: Clock, 
      color: 'warning' 
    },
    { 
      title: 'Processing', 
      value: orders.filter(o => o.status === 'Processing').length.toString(), 
      icon: Package, 
      color: 'info' 
    },
    { 
      title: 'Completed', 
      value: orders.filter(o => o.status === 'Delivered').length.toString(), 
      icon: CheckCircle, 
      color: 'success' 
    }
  ];

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const renderOrderTable = () => {
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

<Box sx={{ display: { xs: 'none', sm: 'block' }, mb: 4 }}>
  <Typography variant="h4" sx={{ 
    fontWeight: 600, 
    mb: 1,
    color: theme.palette.text.primary
  }}>
    Orders
  </Typography>
  <Typography variant="body1" sx={{ 
    color: theme.palette.text.secondary
  }}>
    Manage your customer orders
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
    placeholder="Search orders..."
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
  
{/* Add Order Button - Right */}
<Button
  variant="contained"
  onClick={() => setIsOrderFormOpen(true)}
  sx={{
    borderRadius: '8px',
    height: '50px',
    px: { xs: 0, sm: 2 },
    minWidth: { xs: '48px', sm: 'auto' },
    width: { xs: '48px', sm: 'auto' },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ml: { xs: 2, sm: 2 }
  }}
>
  <Plus size={20} />
  <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>
    Add Order
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
              checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
              indeterminate={selectedOrders.length > 0 && selectedOrders.length < currentOrders.length}
              onChange={toggleSelectAllOrders}
            />
          </TableCell>
          <TableCell sx={{ width: '20%' }}>Order</TableCell>
          <TableCell sx={{ width: '20%' }}>Customer</TableCell>
          <TableCell sx={{ width: '15%' }}>Date</TableCell>
          <TableCell sx={{ width: '15%' }}>Items</TableCell>
          <TableCell sx={{ width: '15%' }}>Total</TableCell>
          <TableCell sx={{ width: '15%' }}>Status</TableCell>
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
          <TableCell colSpan={8} />
        </TableRow>

        {/* Bulk selection row */}
        {selectedOrders.length > 0 && (
          <TableRow sx={{ 
            backgroundColor: 'background.default',
          }}>
            <TableCell colSpan={8} sx={{ 
              padding: '8px 16px',
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0'}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {selectedOrders.length} selected
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
                  onClick={handleBulkDeleteOrders}
                  size="small"
                >
                  Delete
                </Button>
              </Box>
            </TableCell>
          </TableRow>
        )}

        {/* Order rows */}
        {currentOrders.map((order, index) => (
          <TableRow 
            key={order.id} 
            sx={{
              '& td': { 
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#444444' : '#e8e8e8'}`,
                ...(index === currentOrders.length - 1 && {
                  borderBottom: 'none'
                })
              }
            }}
          >
            <TableCell>
              <Checkbox
                checked={selectedOrders.includes(order.id)}
                onChange={() => toggleOrderSelect(order.id)}
                color="error"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                #{order.orderNumber || order.id.substring(0, 6)}
              </Typography>
            </TableCell>
            <TableCell>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {order.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.customerEmail}
                </Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>
              {order.date.toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {order.quantity} {order.quantity === 1 ? 'item' : 'items'}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography sx={{ color: 'text.primary' }}>
                {currencySymbol}{order.price.toLocaleString('en-US')}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                label={order.status}
                size="small"
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(order.status)
                    }}
                  />
                }
                sx={{
                  backgroundColor: getStatusColor(order.status) + '20',
                  color: getStatusColor(order.status),
                  fontWeight: 500,
                  fontSize: '12px',
                  '& .MuiChip-icon': {
                    marginLeft: '8px',
                    marginRight: '-4px'
                  }
                }}
              />
            </TableCell>
            <TableCell sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={(event) => handleMenuOpen(event, order.id)}
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
                  open={Boolean(menuAnchorEl) && menuOrderId === order.id}
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
                      handleEdit(order);
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
                      setSelectedOrderId(order.id);
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
          {currentOrders.map((order) => (
            <Box 
              key={order.id} 
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
                width: 65,
                height: 65,
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'
              }}>
                <img
                  src={order.items?.[0]?.image || '/api/placeholder/200/200'}
                  alt={order.product}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/api/placeholder/200/200'; }}
                />
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
                     #{order.orderNumber || order.id.substring(0, 6)} - {order.customerName}
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
                      {currencySymbol}{order.price.toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: getStatusColor(order.status)
                    }}
                  >
                    {order.status}
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
                    <PencilSimple size={16} color={theme.palette.text.primary} onClick={() => handleEdit(order)} />
                    <Box sx={{ width: '1px', height: '16px', bgcolor: theme.palette.mode === 'dark' ? '#333333' : 'rgba(0, 0, 0, 0.2)' }} />
                    <Trash size={16} color={theme.palette.error.main} onClick={() => {
                      setSelectedOrderId(order.id);
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
        {orderStats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

     

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '20px', sm: '20px', md: '24px' }, letterSpacing: '-0.5px' }}>
            No Orders Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '15px', sm: '16px', md: '18px' }, mb: 4 }}>
            Start by adding your first order.
          </Typography>
          <Fab
            color="primary"
            onClick={() => setIsOrderFormOpen(true)}
            sx={{ boxShadow: 'none' }}
          >
            <Plus size={32} />
          </Fab>
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
            {renderOrderTable()}
          </Box>

          {filteredOrders.length > ordersPerPage && (
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

      {isOrderFormOpen && (
        <>
          <Drawer
  anchor="right"
  open={isOrderFormOpen}
  onClose={() => setIsOrderFormOpen(false)}
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
      // Add safe area insets for mobile
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
    {isEditing ? 'Edit Order' : 'Add your order'}
  </Typography>
  {isMobile && (
    <IconButton onClick={() => setIsOrderFormOpen(false)}>
      <XCircle size={24} />
    </IconButton>
  )}
</Box>
<Typography variant="body2" sx={{ mb: 3, fontSize: '14px', color: 'text.secondary' }}>
  {isEditing ? 'Modify the order details' : 'Create a new order for your shop'}
</Typography>

<form onSubmit={handleSubmit} style={{ 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column',
  paddingBottom: { xs: '80px', sm: '60px' } // Add more padding for desktop
}}>
    <Box sx={{ flex: 1 }}>
  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Name
  </Typography>
  <TextField
    label="Full Name"
    name="customerName"
    value={orderDetails.customerName}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Email
  </Typography>
  <TextField
    label="Email Address"
    name="customerEmail"
    value={orderDetails.customerEmail}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Search Products
  </Typography>
  <Box sx={{ position: 'relative', mb: 2 }}>
    <TextField
      label="Type product name"
      value={productSearch}
      onChange={handleSearchChange}
      onKeyPress={handleSearchKeyPress}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      fullWidth
      placeholder="Start typing to search products..."
    />
    
    {showSuggestions && filteredProducts.length > 0 && (
      <Box sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 2,
        zIndex: 10,
        maxHeight: 200,
        overflowY: 'auto'
      }}>
        {filteredProducts.map((product) => (
          <Box
            key={product.id}
            onClick={() => addProduct(product)}
            sx={{
              px: 2,
              py: 1.5,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Typography variant="body2">{product.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}{product.price?.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Box>
    )}
  </Box>

  {orderDetails.products.length > 0 && (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Selected Products
      </Typography>
      {orderDetails.products.map((product) => (
        <Box key={product.id} sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2,
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}{product.price?.toLocaleString()} each
            </Typography>
          </Box>
          <TextField
            label="Qty"
            type="number"
            value={orderDetails.quantities[product.id] || 1}
            onChange={(e) => {
              const quantity = Math.max(1, parseInt(e.target.value) || 1);
              const newQuantities = { 
                ...orderDetails.quantities, 
                [product.id]: quantity 
              };
              setOrderDetails(prev => ({
                ...prev,
                quantities: newQuantities,
                totalPrice: prev.products.reduce((sum, p) => 
                  sum + (p.price * (newQuantities[p.id] || 1)), 0)
              }));
            }}
            inputProps={{ min: 1 }}
            sx={{ width: '80px' }}
          />
          <IconButton
            size="small"
            onClick={() => removeProduct(product.id)}
            sx={{ color: 'error.main' }}
          >
            <X size={16} />
          </IconButton>
        </Box>
      ))}
    </Box>
  )}

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Total Price
  </Typography>
  <TextField
    label="Total Amount"
    value={orderDetails.totalPrice}
    InputProps={{
      readOnly: true,
    }}
    fullWidth
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Shipping Address
  </Typography>
  <TextField
    label="Shipping Address"
    name="shippingAddress"
    value={orderDetails.shippingAddress}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Order Status
  </Typography>
  <TextField
    select
    label="Order Status"
    name="status"
    value={orderDetails.status || 'Pending'}
    onChange={handleInputChange}
    fullWidth
    sx={{ mb: 2 }}
  >
    {statusOptions.map((status) => (
      <MenuItem key={status} value={status}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: getStatusColor(status)
          }} />
          {status}
        </Box>
      </MenuItem>
    ))}
  </TextField>

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Phone Number
  </Typography>
  <TextField
    label="Phone Number"
    name="customerPhone"
    value={orderDetails.customerPhone}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Customer Address
  </Typography>
  <TextField
    label="Customer Address"
    name="customerAddress"
    value={orderDetails.customerAddress}
    onChange={handleInputChange}
    fullWidth
    required
    sx={{ mb: 2 }}
  />

  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
    Alternate Contact
  </Typography>
  <TextField
    label="Alternate Contact"
    name="alternateContact"
    value={orderDetails.alternateContact}
    onChange={handleInputChange}
    fullWidth
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
    {isEditing ? 'Update Order' : 'Add Order'}
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
          Delete Order
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this order? This action cannot be undone.
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

export default Orders;