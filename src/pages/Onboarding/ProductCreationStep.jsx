import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Avatar,
  IconButton,
} from '@mui/material';
import { Plus, MinusCircle } from '@phosphor-icons/react';

const ProductCreationStep = ({
  storeData,
  onStoreDataChange,
  onProductsUpdate,
  currentUser,
  spaceName,
  products, // Receive from parent
  setProducts // Receive from parent
}) => {
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingField, setEditingField] = useState('');

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    const newProducts = [];
    
    for (const file of files) {
      const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const imageUrl = URL.createObjectURL(file);
      
      newProducts.push({
        id: productId,
        imageFile: file,
        imageUrl: imageUrl,
        name: '', // Start empty
        price: '', // Start empty
        temporary: true
      });
    }
    
    setProducts(prev => [...prev, ...newProducts]); // Use setProducts from props
    setUploading(false);
    e.target.value = '';
  };


  const handleProductChange = (productId, field, value) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, [field]: value }
          : product
      )
    );
  };

  const startEditing = (productId, field) => {
    setEditingProduct(productId);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingProduct(null);
    setEditingField('');
  };

  const handleRemoveProduct = (productId) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
  };


  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', width: '100%' }}>
  <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
    Add Products
  </Typography>
  <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
    Upload at least 3 products to continue
  </Typography>

  <Box sx={{ mb: 4 }}>
    <input
      accept="image/*"
      style={{ display: 'none' }}
      id="bulk-product-images"
      type="file"
      multiple
      onChange={handleImageUpload}
      disabled={uploading}
    />
    <label htmlFor="bulk-product-images">
      <Button 
        variant="outlined" 
        component="span" 
        startIcon={<Plus />}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Product Images'}
      </Button>
    </label>
    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
      Select multiple images to create products quickly
    </Typography>
  </Box>

  <Grid container spacing={2}>
    {products.map((product) => (
      <Grid item xs={12} key={product.id}>
       <Box sx={{ 
  display: 'flex', 
  gap: 2, 
  alignItems: 'flex-start',
  flex: 1,
  minWidth: 0  // Add this to prevent shrinking
}}>
  <Avatar
    src={product.imageUrl}
    sx={{ width: 60, height: 60, borderRadius: 1, flexShrink: 0 }}
    variant="rounded"
  />
  
  <Box sx={{ minWidth: 0, flex: 1 }}>
  {/* Product Name */}
  <Box sx={{ mb: 1 }}> {/* Added some bottom margin */}
    {editingProduct === product.id && editingField === 'name' ? (
      <TextField
        fullWidth
        variant="standard"
        value={product.name}
        onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
        onBlur={stopEditing}
        autoFocus
        placeholder="Product Name" // Add placeholder
        sx={{ 
          '& .MuiInputBase-root': { fontSize: '1rem', fontWeight: 400 },
          '& .MuiInputBase-input': { p: 0 }
        }}
      />
    ) : (
      <Box onClick={() => startEditing(product.id, 'name')}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 500, 
          cursor: 'pointer', 
          minWidth: 0,
          color: product.name ? 'text.primary' : 'text.secondary', // Change color if empty
          opacity: product.name ? 1 : 0.7,
          fontStyle: product.name ? 'normal' : 'normal' // Italic when empty
        }}>
          {product.name || 'Product Name'} {/* Show placeholder when empty */}
        </Typography>
      </Box>
    )}
  </Box>

  {/* Product Price */}
  <Box>
    {editingProduct === product.id && editingField === 'price' ? (
      <TextField
        variant="standard"
        value={product.price}
        onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
        onBlur={stopEditing}
        autoFocus
        placeholder="0" // Add placeholder
        sx={{ 
          width: 100,
          '& .MuiInputBase-root': { fontSize: '0.875rem', fontWeight: 600 },
          '& .MuiInputBase-input': { p: 0 }
        }}
        InputProps={{
          startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.875rem' }}>₦</Typography>,
        }}
      />
    ) : (
      <Box onClick={() => startEditing(product.id, 'price')}>
        <Typography variant="body2" sx={{ 
          fontWeight: 600, 
          color: product.price ? 'primary.main' : 'text.secondary', // Change color if empty
          cursor: 'pointer',
          opacity: product.price ? 1 : 0.7,
          fontStyle: product.price ? 'normal' : 'normal' // Italic when empty
        }}>
          ₦{product.price || '0'} {/* Show placeholder when empty */}
        </Typography>
      </Box>
    )}
  </Box>
</Box>
  
  <IconButton 
    onClick={() => handleRemoveProduct(product.id)}
    color="error"
    size="small"
    sx={{ mt: 0.5, ml: { xs: 17, sm: 35, md: 33 } }}
  >
    <MinusCircle size={20} />
  </IconButton>
</Box>
      </Grid>
    ))}
  </Grid>
</Box>
  );
};

export default ProductCreationStep;