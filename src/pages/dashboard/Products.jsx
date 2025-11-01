import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Stack, Chip, Avatar, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField,
  InputAdornment, Drawer, Fab, Checkbox, Menu, MenuItem, Pagination, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, ImageList, ImageListItem
} from '@mui/material';
import { Plus, MagnifyingGlass, PencilSimple, Trash, Package, XCircle, DotsThree, X, CaretRight, CaretLeft} from 'phosphor-react';
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase';
import { useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import { Search, Bold, Italic, Underline, List, ListOrdered, Quote, Minus, Heading1, Heading2, Sparkle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { generateProductDescription } from '../../utils/aiProductHelper';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

const RichTextEditor = ({ content, onChange, error, onAIGenerate, isAIGenerating }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content'
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  // Remove the AI generation part for now
  const handleAIGeneration = async () => {
    // Comment out or remove AI functionality temporarily
    console.log('AI generation disabled');
  };

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
      {/* Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 0.5, 
        p: 1, 
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'grey.50',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
          >
            <Bold size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
          >
            <Italic size={16} />
          </IconButton>
          
          <Box sx={{ width: '1px', bgcolor: 'grey.300', mx: 0.5 }} />
          
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
          >
            <List size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
          >
            <ListOrdered size={16} />
          </IconButton>
        </Box>
        
        {/* AI Generate Button in Toolbar */}
        {onAIGenerate && (
          <Button
            size="small"
            variant="outlined"
            onClick={onAIGenerate}
            disabled={isAIGenerating}
            startIcon={isAIGenerating ? <CircularProgress size={14} /> : <Sparkle size={14} />}
            sx={{ fontSize: '12px', height: '32px' }}
          >
            AI Generate
          </Button>
        )}
      </Box>

      {/* Editor Content remains the same */}
      <Box sx={{ 
        p: 2, 
        minHeight: 200,
        '& .rich-text-editor-content': {
          minHeight: 150,
          outline: 'none',
          '& p': { margin: 0 },
          '& ul, & ol': { paddingLeft: 2 }
        }
      }}>
        <EditorContent editor={editor} />
      </Box>
      
      {error && (
        <Typography color="error" variant="caption" sx={{ px: 2, pb: 1 }}>
          Description is required
        </Typography>
      )}
    </Box>
  );
};

const Products = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Local state instead of context
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const productsPerPage = 24;
  const [productDetails, setProductDetails] = useState({
    name: '',
    description: '',
    price: '',
    discount: 0,
    category: '',
    images: [],
    stock: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productDetails.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productDetails.images.length - 1 ? 0 : prev + 1));
  };

  const fetchProducts = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('User not authenticated');
        setIsLoading(false);
        return;
      }
  
      // Try fetching from root products collection first (where onboarding saves)
      const rootProductsCollection = collection(db, 'products');
      const rootQuerySnapshot = await getDocs(rootProductsCollection);
      
      const rootProducts = rootQuerySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.ownerId === userId; // Only get products owned by current user
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          images: Array.isArray(doc.data().images) ? doc.data().images : []
        }));
  
      // If no products found in root, try user subcollection (backward compatibility)
      let userProducts = [];
      if (rootProducts.length === 0) {
        const userProductsCollection = collection(db, 'users', userId, 'products');
        const userQuerySnapshot = await getDocs(userProductsCollection);
        userProducts = userQuerySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return (
              data.name &&
              data.description &&
              data.price !== undefined &&
              data.category &&
              data.stock !== undefined
            );
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            images: Array.isArray(doc.data().images) ? doc.data().images : []
          }));
      }
  
      const allProducts = [...rootProducts, ...userProducts];
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCurrency = async () => {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      const storeDetailsRef = doc(db, `users/${userId}/store/storeDetails`);
      const storeDetailsSnap = await getDoc(storeDetailsRef);
      if (storeDetailsSnap.exists()) {
        const { currency } = storeDetailsSnap.data();
        const currencySymbols = {
          USD: '$',
          EUR: '€',
          GBP: '£',
          NGN: '₦',
          JPY: '¥',
          AUD: '$',
          CAD: '$',
          CHF: 'Fr.',
          CNY: '¥'
        };
        setCurrencySymbol(currencySymbols[currency] || '₦');
      }
    };

    fetchCurrency();
  }, []);

  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const getStatusColor = (stock) => {
    return stock > 0 ? '#2E7D32' : '#D32F2F';
  };

  const handleDeleteClick = (productId) => {
    setProductToDelete(productId);
    setDeleteConfirmationOpen(true);
  };

  // Update your generateAIContent function in Products component
const generateAIContent = async (productName, price) => {
  if (!productName.trim()) return;
  
  setIsAIGenerating(true);
  try {
    console.log('🔄 Generating AI content for:', productName, price);
    const aiContent = await generateProductDescription(productName, price);
    console.log('✅ AI Response:', aiContent);
    
    setProductDetails(prev => ({
      ...prev,
      description: aiContent.description || '',
      category: aiContent.category || ''
    }));
    
  } catch (error) {
    console.error('❌ AI generation failed:', error);
  } finally {
    setIsAIGenerating(false);
  }
};

// Update your useEffect to add logging
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('🕒 AI Trigger Check:', {
      isEditing,
      nameLength: productDetails.name?.length,
      hasPrice: productDetails.price !== '' && productDetails.price !== undefined,
      hasDescription: !!productDetails.description.trim()
    });
    
    if (!isEditing && 
        productDetails.name?.length > 2 && 
        (productDetails.price !== '' && productDetails.price !== undefined) && 
        !productDetails.description.trim()) {
      console.log('🚀 Triggering AI generation');
      generateAIContent(productDetails.name, productDetails.price);
    }
  }, 1500);

  return () => clearTimeout(timer);
}, [productDetails.name, productDetails.price, isEditing, productDetails.description]);


  const handleDeleteConfirm = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      const idsToDelete = Array.isArray(productToDelete) ? productToDelete : [productToDelete];
  
      await Promise.all(
        idsToDelete.map(async (id) => {
          // Try deleting from root products first
          const rootProductRef = doc(db, 'products', id);
          const rootProductSnap = await getDoc(rootProductRef);
          
          if (rootProductSnap.exists() && rootProductSnap.data().ownerId === userId) {
            await deleteDoc(rootProductRef);
          } else {
            // Fall back to user subcollection
            const userProductRef = doc(db, 'users', userId, 'products', id);
            await deleteDoc(userProductRef);
          }
        })
      );
  
      const updatedProducts = products.filter(product => !idsToDelete.includes(product.id));
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error deleting products:', error);
    } finally {
      setDeleteConfirmationOpen(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmationOpen(false);
    setProductToDelete(null);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map(p => p.id));
    }
  };

  const toggleProductSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleBulkDelete = () => {
    setProductToDelete(selectedProducts);
    setDeleteConfirmationOpen(true);
  };

  const handleEdit = (product) => {
    if (!product || !product.id) {
      console.error('Invalid product data for editing');
      return;
    }
    
    setSelectedProductId(product.id);
    setSelectedProduct(product);
    setProductDetails({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      discount: product.discount || 0,
      category: product.category || '',
      images: Array.isArray(product.images) ? product.images : [],
      stock: product.stock?.toString() || ''
    });
    setIsEditing(true);
    setIsProductFormOpen(true);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target || {};
    
    if (!e.target) {
      setProductDetails(prev => ({
        ...prev,
        description: e
      }));
      setFormErrors(prev => ({
        ...prev,
        description: false
      }));
      return;
    }
  
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    setFormErrors(prev => ({
      ...prev,
      [name]: false
    }));
  };

  const handleImageUpload = async (event) => {
    setLoading(true);
    const files = Array.from(event.target.files);
    
    // Check if adding these files would exceed reasonable limit
    const totalImages = productDetails.images.length + files.length;
    if (totalImages > 10) {
      alert('Maximum 10 images allowed per product');
      setLoading(false);
      return;
    }
  
    try {
      const imageUrls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "my_products");
  
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/dz0vrbq8o/image/upload?q=auto:good&f=auto&dpr=auto`,
            {
              method: "POST",
              body: formData
            }
          );
  
          const data = await response.json();
          return data.secure_url;
        })
      );
  
      setProductDetails((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls] // Append new images
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductDetails({
      name: '',
      description: '',
      price: '',
      discount: 0,
      category: '',
      images: [],
      stock: ''
    });
    setIsEditing(false);
    setSelectedProductId(null);
    setSelectedProduct(null); // Add this line
  };

  const RoundedCheckbox = styled(Checkbox)({
    '& .MuiSvgIcon-root': {
      borderRadius: '4px',
      backgroundColor: 'transparent',
      '&.Mui-checked': {
        backgroundColor: 'currentColor',
      }
    },
  });

  const isFormValid = () => {
    const errors = {
      name: !productDetails.name.trim(),
      description: !productDetails.description || productDetails.description.trim() === '',
      price: !productDetails.price || isNaN(productDetails.price) || Number(productDetails.price) <= 0,
      category: !productDetails.category,
      stock: !productDetails.stock || isNaN(productDetails.stock) || Number(productDetails.stock) < 0,
      discount: isNaN(productDetails.discount) || productDetails.discount < 0 || productDetails.discount > 100,
      images: productDetails.images.length === 0
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }
    
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('User not authenticated');
        return;
      }
  
      const newProduct = {
        name: productDetails.name,
        description: productDetails.description,
        price: Number(productDetails.price),
        discount: Number(productDetails.discount),
        category: productDetails.category,
        images: Array.isArray(productDetails.images) ? productDetails.images : [],
        stock: Number(productDetails.stock),
        ownerId: userId, // Add ownerId for filtering
        updatedAt: new Date()
      };
  
      if (isEditing && selectedProductId) {
        // Try updating in root products first
        const rootProductRef = doc(db, 'products', selectedProductId);
        const rootProductSnap = await getDoc(rootProductRef);
        
        if (rootProductSnap.exists() && rootProductSnap.data().ownerId === userId) {
          await updateDoc(rootProductRef, newProduct);
        } else {
          // Fall back to user subcollection
          const userProductRef = doc(db, 'users', userId, 'products', selectedProductId);
          await updateDoc(userProductRef, newProduct);
        }
        
        const updatedProducts = products.map(product => 
          product.id === selectedProductId 
            ? { ...product, ...newProduct }
            : product
        );
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
      } else {
        // Always create new products in root collection
        const productsCollection = collection(db, 'products');
        const docRef = await addDoc(productsCollection, {
          ...newProduct,
          createdAt: new Date()
        });
        const addedProduct = { ...newProduct, id: docRef.id };
        
        const updatedProducts = [...products, addedProduct];
        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
      }
  
      resetForm();
      setIsProductFormOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const renderProductTable = () => {
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
        paddingTop: { xs: 6, sm: 6 },
        paddingBottom: { xs: 3, sm: 3 }
      }}>


        {/* Header Section - Desktop Only */}
<Box sx={{ display: { xs: 'none', sm: 'block' }, mb: 6 }}>
  <Typography variant="h4" sx={{ 
    fontWeight: 600, 
    mb: 1,
    color: theme.palette.text.primary
  }}>
    Products
  </Typography>
  <Typography variant="body1" sx={{ 
    color: theme.palette.text.secondary,
    fontSize:'16px'
  }}>
    Manage your product inventory
  </Typography>
</Box>
        
        <Box sx={{
  mb: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  {/* Search Field - Left */}
  <TextField
    placeholder="Search products..."
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
  
  {/* Add Product Button - Right */}
  <Button
    variant="contained"
    onClick={() => setIsProductFormOpen(true)}
    sx={{
      borderRadius: '8px',
      py:'12px',
      px: 1.7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <Plus size={20} />
    <Box sx={{ ml: 1 }}>
      Add Product
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
  pb: 2,
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
    <RoundedCheckbox
  checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
  indeterminate={selectedProducts.length > 0 && selectedProducts.length < currentProducts.length}
  onChange={toggleSelectAll}
/>
    </TableCell>
    <TableCell sx={{ width: '35%' }}>Product</TableCell>
    <TableCell sx={{ width: '20%' }}>Category</TableCell>
    <TableCell sx={{ width: '15%' }}>Price</TableCell>
    <TableCell sx={{ width: '15%' }}>Stock</TableCell>
    <TableCell sx={{ 
      width: '10%', 
      textAlign: 'right',
      borderTopRightRadius: '12px'
    }}>Action</TableCell>
  </TableRow>
</TableHead>
      
<TableBody>

<TableRow sx={{ height: '26px', '& td': { border: 'none', padding: 0 } }}>
    <TableCell colSpan={6} />
  </TableRow>

        {/* Bulk selection row */}
        {selectedProducts.length > 0 && (
          <TableRow sx={{ 
            backgroundColor: 'background.default',
          }}>
            <TableCell colSpan={6} sx={{ 
              padding: '8px 16px',
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0'}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {selectedProducts.length} selected
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
                  onClick={handleBulkDelete}
                  size="small"
                >
                  Delete
                </Button>
              </Box>
            </TableCell>
          </TableRow>
        )}

        {/* Product rows */}
        {currentProducts.map((product, index) => (
       <TableRow 
       key={product.id} 
       sx={{
         '& td': { 
           borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#444444' : '#e8e8e8'}`,
           ...(index === currentProducts.length - 1 && {
             borderBottom: 'none'
           })
         }
       }}
     >
            <TableCell>
            <RoundedCheckbox
  checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
  indeterminate={selectedProducts.length > 0 && selectedProducts.length < currentProducts.length}
  onChange={toggleSelectAll}
/>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
  width: 52,
  height: 50,
  borderRadius: '10px',
  overflow: 'hidden',
  flexShrink: 0,
  bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}}>
                  {((product.images && product.images.length > 0) || product.imageUrl) ? (
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl}
                      alt={product.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      loading="lazy"
                    />
                  ) : null}
                  <Box 
                    sx={{
                      display: ((product.images && product.images.length > 0) || product.imageUrl) ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <Package size={20} color={theme.palette.text.secondary} />
                  </Box>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 500, 
                    fontFamily: 'Inter', 
                    fontSize: '16px',
                    color: 'text.primary'
                  }}
                >
                  {product.name}
                </Typography>
              </Box>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary' }}>
              {product.category || 'Uncategorized'}
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: 'text.primary' }}>
                  {currencySymbol}{product.price.toLocaleString('en-US')}
                </Typography>
                {product.discount > 0 && (
                  <Typography 
                    component="span" 
                    sx={{
                      color: 'error.main',
                      fontWeight: 600,
                      fontSize: '15px',
                      backgroundColor: theme.palette.mode === 'dark' ? '#3a1a1a' : '#fdecea',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    -{product.discount}%
                  </Typography>
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: getStatusColor(product.stock),
                fontWeight: 500,
                fontSize: '12px'
              }}>
                <Box sx={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '100%',
                  bgcolor: getStatusColor(product.stock),
                  mr: 1
                }} />
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Box>
            </TableCell>
            <TableCell sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    setAnchorEl(event.currentTarget);
                    setSelectedProductId(product.id);
                  }}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : 'rgba(0, 0, 0, 0.04)' 
                    }
                  }}
                >
                  <DotsThree size={18} color={theme.palette.text.primary} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && selectedProductId === product.id}
                  onClose={() => {
                    setAnchorEl(null);
                  }}
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
                      const productToEdit = products.find(p => p.id === selectedProductId);
                      if (productToEdit) {
                        handleEdit(productToEdit);
                      }
                      setAnchorEl(null);
                    }}
                    sx={{ 
                      fontSize: '15x', 
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
                      handleDeleteClick(product.id);
                      setAnchorEl(null);
                    }}
                    sx={{ 
                      fontSize: '15px', 
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
        {/* Mobile Cards */}
<Box sx={{
  display: { xs: 'block', sm: 'none' },
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  border: 'none',
  mt: 0,
  overflow: 'hidden'
}}>
  {currentProducts.map((product) => (
    <Box 
      key={product.id} 
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
  width: 50,
  height: 50,
  borderRadius: '12px',
  overflow: 'hidden',
  flexShrink: 0,
  bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}}>
        {((product.images && product.images.length > 0) || product.imageUrl) ? (
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl}
            alt={product.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            loading="lazy"
          />
        ) : null}
        <Box 
          sx={{
            display: ((product.images && product.images.length > 0) || product.imageUrl) ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <Package size={20} color={theme.palette.text.secondary} />
        </Box>
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
              width: '100%',
              color: theme.palette.text.primary
            }}
          >
            {product.name}
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
              {currencySymbol}{product.price.toLocaleString()}
            </Typography>
            {product.discount > 0 && (
              <Chip
                label={`${product.discount}% OFF`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  bgcolor: theme.palette.mode === 'dark' ? '#3a1a1a' : '#fff8e1',
                  color: theme.palette.mode === 'dark' ? '#ff8f00' : '#ff8f00'
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              fontWeight: 400,
              color: getStatusColor(product.stock)
            }}
          >
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
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
          <PencilSimple 
            size={16} 
            color={theme.palette.text.primary} 
            onClick={() => {
              handleEdit(product);
            }} 
          />
            <Box sx={{ width: '1px', height: '16px', bgcolor: theme.palette.mode === 'dark' ? '#333333' : 'rgba(0, 0, 0, 0.2)' }} />
            <Trash size={16} color={theme.palette.error.main} onClick={() => handleDeleteClick(product.id)} />
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
  
     

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4} sx={{ display: 'none' }}>
        {[
          { title: 'Total Products', value: products.length.toString(), color: 'primary' },
          { title: 'Active Products', value: products.filter(p => p.stock > 0).length.toString(), color: 'success' },
          { title: 'Out of Stock', value: products.filter(p => p.stock === 0).length.toString(), color: 'error' },
          { title: 'Draft Products', value: '0', color: 'warning' }
        ].map((stat, index) => (
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
     ) : (!products || products.length === 0) ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '20px', sm: '20px', md: '24px' }, letterSpacing: '-0.5px' }}>
            No Products Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '15px', sm: '16px', md: '18px' }, mb: 4 }}>
            Start by adding your first product.
          </Typography>
          <Fab
            color="primary"
            onClick={() => setIsProductFormOpen(true)}
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
            {renderProductTable()}
          </Box>

          {filteredProducts.length > productsPerPage && (
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

{isProductFormOpen && (
     <Drawer
     anchor="right"
     open={isProductFormOpen}
     onClose={() => {
       setIsProductFormOpen(false);
       resetForm();
     }}
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
         backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff'
       }
     }}
   >
      <Box sx={{ width: '100%', p: 3, height: '100%', boxSizing: 'border-box', pb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
          <Typography variant="superbody" sx={{ fontSize: { xs: '20px', md: '22px' }, fontWeight: 600, letterSpacing: '-0.5px' }}>
            {isEditing ? 'Edit Product' : 'Add your product'}
          </Typography>
          <IconButton onClick={() => setIsProductFormOpen(false)}>
            <XCircle size={24} />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ mb: 3, fontSize: '15px', color: 'text.secondary' }}>
          {isEditing ? 'Modify the product details' : 'Stock your shop with a new product'}
        </Typography>
    
        <form onSubmit={handleSubmit}>
          {/* Image Upload Section at the Top */}
          <Box sx={{
  mb: 3,
  border: `1px dashed ${theme.palette.mode === 'dark' ? '#333' : '#ccc'}`,
  borderRadius: '8px',
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f7f7f7',
  minHeight: '150px',
  position: 'relative',
  overflow: 'hidden', // Remove scroll bar
}}>
  {productDetails.images.length === 0 ? (
    <>
      <Button
        component="label"
        variant="outlined"
        sx={{
          borderRadius: '50%',
          minWidth: '48px',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: theme.palette.mode === 'dark' ? '#333' : '#ccc',
          bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff',
          '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0' }
        }}
      >
        {loading ? <CircularProgress size={20} /> : <Plus size={24} />}
        <VisuallyHiddenInput
          type="file"
          multiple
          onChange={handleImageUpload}
          accept="image/*"
        />
      </Button>
      <Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '12px', color: '#6d6d6d', mt: 1, textAlign: 'center' }}>
        Click to upload product images (multiple images supported)
      </Typography>
    </>
  ) : (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      width: '100%', 
      position: 'relative',
      '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '40px',
        zIndex: 1,
        pointerEvents: 'none' // Allows clicking through the fade
      },
      '&::before': {
  left: 0,
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(90deg, #1a1a1a 0%, transparent 100%)'
    : 'linear-gradient(90deg, #fff 0%, transparent 100%)'
},
'&::after': {
  right: 0,
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(270deg, #1a1a1a 0%, transparent 100%)'
    : 'linear-gradient(270deg, #fff 0%, transparent 100%)'
}
    }}>
      {/* Left navigation arrow */}
      <IconButton
        sx={{ 
          position: 'absolute', 
          left: 0, 
          zIndex: 3, 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
        }}
        onClick={() => {
          // Scroll left logic would go here
          const container = document.getElementById('image-scroll-container');
          if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
        }}
      >
        <CaretLeft size={16} weight="fill" />
      </IconButton>

      {/* Image container with hidden scroll */}
      <Box 
        id="image-scroll-container"
        sx={{ 
          display: 'flex', 
          gap: 1, 
          width: '100%', 
          px: 4, // Padding for arrows
          overflowX: 'hidden', // Hide scroll bar
          scrollBehavior: 'smooth'
        }}
      >
        {productDetails.images.map((image, index) => (
          <Box key={index} sx={{ position: 'relative', flexShrink: 0, width: '120px', height: '120px' }}>
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectPosition: 'top center', 
                objectFit: 'cover', 
                backgroundColor: 'white',
                borderRadius: '8px' 
              }}
              loading="lazy"
            />
            <IconButton
              sx={{ 
                position: 'absolute', 
                top: 5, 
                right: 5,
                width: 20,
                height: 20,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '5px', // Rounded square
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setProductDetails(prev => ({
                  ...prev,
                  images: prev.images.filter((_, i) => i !== index)
                }));
              }}
            >
              <Minus size={12} color="black" weight="bold" />
            </IconButton>
          </Box>
        ))}
        <Button
          component="label"
          variant="outlined"
          sx={{
            minWidth: '120px',
            height: '120px',
            border: `2px dashed ${theme.palette.mode === 'dark' ? '#333' : '#ccc'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f7f7f7',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0'
            }
          }}
        >
          {loading ? <CircularProgress size={20} /> : <Plus size={24} />}
          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
            Add more
          </Typography>
          <VisuallyHiddenInput
            type="file"
            multiple
            onChange={handleImageUpload}
            accept="image/*"
          />
        </Button>
      </Box>

      {/* Right navigation arrow */}
      <IconButton
        sx={{ 
          position: 'absolute', 
          right: 0, 
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
        }}
        onClick={() => {
          // Scroll right logic would go here
          const container = document.getElementById('image-scroll-container');
          if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
        }}
      >
        <CaretRight size={16} weight="fill" />
      </IconButton>
    </Box>
  )}
</Box>
    
          {/* Form Fields */}
<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
  Product Name
</Typography>
<TextField
  name="name"
  value={productDetails.name}
  onChange={handleInputChange}
  fullWidth
  error={formErrors.name}
  helperText={formErrors.name ? "Product name is required" : ""}
  required
  sx={{ mb: 2 }}
/>
<Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '12px', color: '#6d6d6d', mb: 2, lineHeight: '130%' }}>
  Choose a concise, clear product name.
</Typography>

{/* Product Description with both header button and toolbar button */}
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
    Product Description {isAIGenerating && <CircularProgress size={12} />}
  </Typography>
</Box>
<RichTextEditor
  content={productDetails.description}
  onChange={(newContent) => handleInputChange(newContent)}
  error={formErrors.description}
  onAIGenerate={() => generateAIContent(productDetails.name, productDetails.price)}
  isAIGenerating={isAIGenerating}
/>
<Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '12px', color: '#6d6d6d', mt: 1, mb: 2, lineHeight: '130%' }}>
  Give your product a short and clear description.
</Typography>

<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
  Pricing
</Typography>
<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
  <Box sx={{ flex: 1 }}>
  <TextField
  label="Price"
  name="price"
  value={productDetails.price === 0 ? '' : productDetails.price.toString()}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    // Remove the "0" default - just use the raw value
    handleInputChange({ target: { name: 'price', value: rawValue } });
  }}
  onBlur={(e) => {
    const val = parseFloat(e.target.value.replace(/,/g, ''));
    if (!isNaN(val)) {
      handleInputChange({ target: { name: 'price', value: val } });
    } else {
      // If invalid, set to empty string instead of 0
      handleInputChange({ target: { name: 'price', value: '' } });
    }
  }}
  type="text"
  fullWidth
  error={formErrors.price}
  helperText={formErrors.price ? 'Price must be greater than 0' : ''}
  required
  InputProps={{ 
    endAdornment: <Box sx={{ pl: 1, pr: 2, fontSize: '14px' }}>{currencySymbol}</Box> 
  }}
/>
  </Box>
  <Box sx={{ flex: 1 }}>
    <TextField
      label="Discount"
      name="discount"
      value={productDetails.discount}
      onChange={handleInputChange}
      type="number"
      fullWidth
      error={formErrors.discount}
      helperText={formErrors.discount ? "Discount must be 0-100%" : ""}
      inputProps={{ min: 0, max: 100, step: 1 }}
      InputProps={{ endAdornment: <Box sx={{ pr: 2, fontSize: '14px' }}>%</Box> }}
    />
  </Box>
</Box>

<Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
  Inventory
</Typography>
<TextField
  label="Stock Quantity"
  name="stock"
  value={productDetails.stock}
  onChange={handleInputChange}
  type="text"
  fullWidth
  error={formErrors.stock}
  helperText={formErrors.stock ? "Stock must be greater than 0" : ""}
  required
  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
  sx={{ mb: 2 }}
/>
<Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '12px', color: '#6d6d6d', mb: 4, lineHeight: '130%' }}>
  How much of this product do you have in stock?
</Typography>

<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
    Category
  </Typography>
  <Button 
    size="small" 
    onClick={() => generateAIContent(productDetails.name, productDetails.price)}
    disabled={!productDetails.name || isAIGenerating}
    startIcon={isAIGenerating ? <CircularProgress size={14} /> : <Sparkle size={16} />}
  >
    Regenerate
  </Button>
</Box>
<TextField
  name="category"
  value={productDetails.category}
  onChange={handleInputChange}
  fullWidth
  error={formErrors.category}
  required
  inputProps={{ maxLength: 30 }}
  sx={{ mb: 2 }}
/>
<Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: '12px', color: '#6d6d6d', mb: 2 }}>
  Enter a category name (e.g. 'Electronics', 'Beauty')
</Typography>
    
          <Button
  type="submit"
  variant="contained"
  color="primary"
  fullWidth
  sx={{ 
    mt: 2, 
    mb: 4,
    padding: '12px 24px',
    fontSize: '16px'
  }}
>
            {isEditing ? 'Update Product' : 'Add Product'}
          </Button>
        </form>
      </Box>
    </Drawer>
      )}

<Dialog
  open={deleteConfirmationOpen}
  onClose={handleDeleteCancel}
  BackdropProps={{
    sx: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)'
    }
  }}
>
        <DialogTitle sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px' }}>
          Delete Product
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

  
    </Box>
  );
};

export default Products;