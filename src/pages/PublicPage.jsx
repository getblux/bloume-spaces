import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import StorefrontPage from './dashboard/Storefront';
import { Button } from '@mui/material';

const PublicPage = () => {
  const { spaceName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchStoreData();
  }, [spaceName]);

  const fetchStoreData = async () => {
    try {
      const storeDoc = doc(db, 'stores', spaceName.toLowerCase());
      const storeSnap = await getDoc(storeDoc);
      
      if (!storeSnap.exists()) {
        navigate('/');
        return;
      }

      const store = storeSnap.data();
      setStoreData(store);

      const productsCollection = collection(db, 'users', store.ownerId, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const fetchedProducts = productsSnapshot.docs
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
    } catch (error) {
      console.error('Error loading store:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const isInsideWhatsApp = () => {
    return /WhatsApp/i.test(navigator.userAgent);
  };
  
  const OpenInWhatsAppButton = () => {
    if (isMobile() && !isInsideWhatsApp()) {
      return (
        <Button 
          variant="contained" 
          onClick={() => {
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(window.location.href)}`;
            window.location.href = whatsappUrl;
          }}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            borderRadius: '50px',
            backgroundColor: '#25D366',
            '&:hover': {
              backgroundColor: '#128C7E'
            }
          }}
        >
          Share
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!storeData) {
    return null;
  }

  return (
    <Box>
      <StorefrontPage
        cart={[]}
        setCart={() => {}}
        brandColor={storeData.brandColor || '#4a5ac7'}
        fontFamily={storeData.fontFamily || 'Inter'}
        coverImage={storeData.coverImage}
        storeLogo={storeData.profileImageUrl}
        shopName={storeData.storeName}
        handleProductClick={(product) => {
          console.log('Product clicked:', product);
        }}
        onAddToCart={(product, quantity) => {
          console.log('Add to cart:', product, quantity);
        }}
        onCoverImageUpdate={() => {}}
        setActivePage={() => {}}
        contrastText="#ffffff"
        products={products}
      />
      <OpenInWhatsAppButton />
    </Box>
  );
};

export default PublicPage;