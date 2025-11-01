import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, IconButton, Pagination, Tabs, Tab, Button, CircularProgress, InputBase } from '@mui/material';
import { Plus, Minus, MagnifyingGlass, ShoppingCartSimple, X } from 'phosphor-react';
import { Camera } from 'lucide-react';
import { PencilSimple } from 'phosphor-react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebase'; // Adjust path as needed
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed


const StorefrontPage = ({
  cart,
  setCart,
  brandColor,
  fontFamily,
  coverImage,
  storeLogo,
  shopName,
  handleProductClick,
  onAddToCart,
  onCoverImageUpdate,
  setActivePage, 
  contrastText,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobile, setIsMobile] = useState(false);
  const [columnCount, setColumnCount] = useState(3);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editableTitle, setEditableTitle] = useState(shopName || 'Welcome to Our Store');
  const [editableBio, setEditableBio] = useState('Discover amazing products and exclusive offers');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const productsCollection = collection(db, 'users', userId, 'products');
        const querySnapshot = await getDocs(productsCollection);
        const fetchedProducts = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.name && data.price !== undefined;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            images: Array.isArray(doc.data().images) ? doc.data().images : []
          }));

        setProducts(fetchedProducts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    setDisplayedProducts(products || []);
  }, [products]);

 // Handle search filtering
useEffect(() => {
  if (!products) return;
  
  if (!searchTerm || !searchTerm.trim()) {
    setDisplayedProducts(products);
    return;
  }

  const filtered = products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  setDisplayedProducts(filtered);
  setPage(1);
}, [searchTerm, products]);

  const handleScroll = (event) => {
    setScrollY(event.target.scrollTop);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'my_products');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dz0vrbq8o/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        onCoverImageUpdate(data.secure_url);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Categories based on displayed products
  const categoriesList = useMemo(() => {
    const allCategories = new Set();
    displayedProducts?.forEach(product => {
      if (product?.category && typeof product.category === 'string') {
        allCategories.add(product.category);
      } else {
        allCategories.add('Uncategorized');
      }
    });
    return ['All', ...Array.from(allCategories).sort()];
  }, [displayedProducts]);

  // Categorized products based on active category
  const categorizedProducts = useMemo(() => {
    if (!Array.isArray(displayedProducts)) return [];
    if (activeCategory === 'All') return displayedProducts;
    if (activeCategory === 'Uncategorized') {
      return displayedProducts.filter(product => !product.category);
    }
    return displayedProducts.filter(product => product.category === activeCategory);
  }, [displayedProducts, activeCategory]);

  const coverHeight = isMobile ? 350 : 450;
  const isNavbarWhite = scrollY > coverHeight;

  const itemsPerPage = 20;
  const totalPages = Math.ceil(categorizedProducts.length / itemsPerPage);
  const paginatedProducts = categorizedProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getProductQuantity = (productId) => {
    if (!cart) return 0;
    const cartItem = cart.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getOptimizedImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '/default-image.jpg';
    return url.includes('res.cloudinary.com')
      ? url.replace('/upload/', '/upload/q_auto,f_auto,w_500,h_500,c_fill/')
      : url;
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    // Optional: Save to backend here
  };

  const handleBioSave = () => {
    setIsEditingBio(false);
    // Optional: Save to backend here
  };

  const handleKeyPress = (e, saveFunction) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFunction();
    }
  };

  return (
    <Box>
      {/* Navbar code remains exactly the same */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1300,
          backgroundColor: '#fff',
          borderBottom: '1px solid #eee',
          height: '64px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            px: { xs: 2, sm: 2.5 },
          }}
        >
          {!isSearchOpen ? (
            <>
              {storeLogo ? (
                <img src={storeLogo} alt="logo" style={{ height: 40 }} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {shopName || 'Shop'}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => setIsSearchOpen(true)}>
                  <MagnifyingGlass size={20} />
                </IconButton>
                <IconButton onClick={() => setActivePage('cart')}>
                  <ShoppingCartSimple />
                  {cart && cart.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: brandColor,
                        color: 'white',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {cart.length}
                    </Box>
                  )}
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <MagnifyingGlass size={20} weight="bold" style={{ flexShrink: 0, color: 'rgba(0,0,0,0.5)' }} />
              <InputBase
  fullWidth
  placeholder="Search products..."
  value={searchTerm || ''}
  onChange={handleSearchChange}
  autoFocus
                sx={{
                  fontSize: '1rem',
                  height: '100%',
                  padding: '0 8px',
                  '& input': {
                    padding: '0 !important'
                  }
                }}
              />
              <IconButton 
                onClick={() => setIsSearchOpen(false)}
                sx={{ flexShrink: 0 }}
              >
                <X size={20} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{
  width: "100%",
  position: 'relative',
  height: { xs: '450px', sm: '400px', md: '550px' },
  marginBottom: 0,
  zIndex: 1
}}>
  <Box sx={{
    width: "100%",
    height: "100%",
    backgroundImage: coverImage 
      ? `url(${coverImage})` 
      : 'linear-gradient(to bottom, #4a5ac7, #5a3485)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      zIndex: 1
    }
  }} />
  
  <Box sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, transparent 60%, white 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: { xs: 3, md: 6 },
    zIndex: 2
  }}>

    <IconButton
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 3,
        backgroundColor: 'rgba(255,255,255,0.9)',
        '&:hover': { backgroundColor: 'white' }
      }}
      onClick={() => document.getElementById('cover-image-upload').click()}
      disabled={isUploadingCover}
    >
      {isUploadingCover ? (
        <CircularProgress size={20} />
      ) : (
        <Camera size={20} />
      )}
      <input
        id="cover-image-upload"
        type="file"
        accept="image/*"
        onChange={handleCoverImageUpload}
        style={{ display: 'none' }}
      />
    </IconButton>

    <Box sx={{ 
        maxWidth: '600px',
        color: 'white',
        textAlign: 'left',
        zIndex: 2
      }}>
        {isEditingTitle ? (
          <InputBase
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyPress={(e) => handleKeyPress(e, handleTitleSave)}
            autoFocus
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
              fontFamily: fontFamily,
              backgroundColor: 'rgba(255,255,255,0.2)',
              px: 1,
              borderRadius: 1,
              width: '100%'
            }}
          />
        ) : (
          <Typography 
            variant="h1" 
            onClick={() => setIsEditingTitle(true)}
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
              fontFamily: fontFamily,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                px: 1
              }
            }}
          >
            {editableTitle}
          </Typography>
        )}

        {isEditingBio ? (
          <InputBase
            value={editableBio}
            onChange={(e) => setEditableBio(e.target.value)}
            onBlur={handleBioSave}
            onKeyPress={(e) => handleKeyPress(e, handleBioSave)}
            autoFocus
            multiline
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              mb: 4,
              opacity: 0.9,
              fontFamily: fontFamily,
              backgroundColor: 'rgba(255,255,255,0.2)',
              px: 1,
              borderRadius: 1,
              width: '100%'
            }}
          />
        ) : (
          <Typography 
            variant="body1" 
            onClick={() => setIsEditingBio(true)}
            sx={{ 
              fontSize: { xs: '1rem', md: '1.2rem' },
              mb: 4,
              opacity: 0.9,
              fontFamily: fontFamily,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                px: 1
              }
            }}
          >
            {editableBio}
          </Typography>
        )}
        
        <Button
          variant="contained"
          sx={{
            backgroundColor: brandColor,
            color: contrastText,
            px: 3,
            py: 1,
            fontSize: '1rem',
            fontWeight: 500,
            borderRadius:'999px',
            '&:hover': {
              backgroundColor: brandColor,
              opacity: 0.9
            }
          }}
        >
          Message Store
        </Button>
      </Box>
  </Box>
</Box>

      
      <Box component="section" sx={{
        py: { xs: 1, md: 6 },
        px: { xs: 0, md: 4 },
        bgcolor: '#fff',
        mt: 0,
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
        width: '100%'
      }}>
        <Box sx={{
          mb: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          width: '100vw',
          marginLeft: { xs: '-16px', md: 0 },
          paddingLeft: { xs: '16px', md: 0 },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Tabs
            value={activeCategory}
            onChange={(e, newValue) => setActiveCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { display: 'none' },
              minHeight: '48px'
            }}
          >
            {categoriesList.map((category) => (
              <Tab
                key={category}
                label={category}
                value={category}
                sx={{
                  minWidth: 'unset',
                  px: { xs: 1.2, md: 2.7 },
                  mx: 0,
                  color: activeCategory === category ? 'black' : 'grey',
                  fontWeight: activeCategory === category ? 600 : 400,
                  fontSize: { xs: '0.85rem', md: '1rem' },
                  textTransform: 'capitalize',
                  '&:hover': { color: 'black' }
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{
  pt: 1,
  pb: 6,
  px: { xs: 0.5, md: 0 }
}}>
  {isLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  ) : (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      columnGap: '0px',
      rowGap: '24px',
      alignItems: 'start',
      width: '100%',
      overflow: 'hidden',
      padding: { xs: '0 4px', md: 0 }
    }}>
      {paginatedProducts.map((product) => {
        const images = Array.isArray(product.images) ? product.images : [];
        const imageUrl = getOptimizedImageUrl(images[0]);
        return (
          <Box
            key={product.id}
            sx={{
              height: '100%',
              position: 'relative',
              padding: { xs: '0 4px', md: '0 8px' }
            }}
          >
            <Box
              onClick={() => handleProductClick(product)}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.02)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': { transform: 'scale(1.02)' },
                position: 'relative',
              }}
            >
              <img
                src={imageUrl}
                alt={product.name}
                style={{
                  width: '100%',
                  display: 'block',
                  aspectRatio: '1/1',
                  objectFit: 'contain',
                  backgroundColor: '#fff',
                }}
                loading="lazy"
              />

              {product?.discount > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: '#ffebee',
                  color: '#d32f2f',
                  px: 1,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'Inter',
                }}>
                  {product.discount}% OFF
                </Box>
              )}

              <Box sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                display: 'flex',
                bgcolor: 'white',
                borderRadius: '5px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
                zIndex: 10,
                transform: 'scale(1.0)',
                transformOrigin: 'bottom right'
              }}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    if (getProductQuantity(product.id) > 0) {
                      onAddToCart(product, -getProductQuantity(product.id));
                    } else {
                      onAddToCart(product, 1);
                    }
                  }}
                  sx={{
                    color: getProductQuantity(product.id) > 0 ? brandColor : 'text.primary',
                    transition: 'all 0.2s ease',
                    padding: '4px',
                    '& svg': {
                      width: '16px',
                      height: '16px'
                    }
                  }}
                >
                  {getProductQuantity(product.id) > 0 ? (
                    <Minus size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ mt: 1.5, mb: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: fontFamily,
                  fontWeight: 500,
                  fontSize: { xs: '13px', md: '15px' },
                  lineHeight: 1.2,
                  cursor: 'pointer',
                }}
              >
                {product.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: { xs: '13px', md: '13px' },
                  }}
                >
                  ₦{
                    (() => {
                      const price = Number(product.price);
                      const discount = Math.min(Number(product.discount || 0), 100);
                      return !isNaN(price)
                        ? (price * (1 - discount / 100)).toFixed(2)
                        : '--';
                    })()
                  }
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  )}
  {!isLoading && totalPages > 1 && (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(e, value) => setPage(value)}
        color="primary"
        size={isMobile ? 'small' : 'medium'}
      />
    </Box>
  )}
</Box>
      </Box>
    </Box>
  );
};

export default StorefrontPage;