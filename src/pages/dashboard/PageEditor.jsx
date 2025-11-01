import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Button, Card, Chip, Avatar } from '@mui/material';
import { MagnifyingGlass, ShoppingCartSimple, X, Users, Star } from '@phosphor-icons/react';
import { Camera } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Adjust path as needed
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed

const StorefrontPage = ({ communityId, community, isPreview = false, onJoinClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [communityData, setCommunityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (community) {
        // If community data is passed as prop, use it
        setCommunityData(community);
        setLoading(false);
        return;
      }

      if (communityId) {
        // Fetch from Firestore using communityId
        try {
          const communityDoc = await getDoc(doc(db, 'communities', communityId));
          if (communityDoc.exists()) {
            setCommunityData(communityDoc.data());
          }
        } catch (error) {
          console.error('Error fetching community data:', error);
        } finally {
          setLoading(false);
        }
      } else if (currentUser) {
        // Fetch current user's community
        try {
          const communityDoc = await getDoc(doc(db, 'communities', currentUser.uid));
          if (communityDoc.exists()) {
            setCommunityData(communityDoc.data());
          }
        } catch (error) {
          console.error('Error fetching community data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [community, communityId, currentUser]);

  // Fallback data while loading or if no data
  const displayData = communityData || {
    title: "Your Community",
    description: "Community description will appear here...",
    category: "Category",
    price: 0,
    coverImage: '',
    whatsappLink: '',
    paymentType: 'one-time'
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading community...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Navbar */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1300,
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee',
        height: '64px'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          px: { xs: 2, sm: 2.5 },
        }}>
          {!isSearchOpen ? (
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {displayData.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => setIsSearchOpen(true)}>
                  <MagnifyingGlass size={20} />
                </IconButton>
                <Button 
                  variant="contained"
                  sx={{
                    backgroundColor: '#4a5ac7',
                    color: 'white',
                    px: 3,
                    borderRadius: '8px',
                  }}
                >
                  Join Community
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <MagnifyingGlass size={20} style={{ flexShrink: 0, color: 'rgba(0,0,0,0.5)' }} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  width: '100%',
                  padding: '8px 0'
                }}
              />
              <IconButton onClick={() => setIsSearchOpen(false)}>
                <X size={20} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

     {/* Header Section with same width */}
<Box sx={{ 
  maxWidth: '1200px', 
  margin: '0 auto',
  width: '100%'
}}>
  <Box sx={{
    position: 'relative',
    height: { xs: '400px', sm: '450px', md: '500px' },
    marginBottom: 0,
  }}>
    <Box sx={{
      width: "100%",
      height: "100%",
      backgroundImage: displayData.coverImage 
        ? `url(${displayData.coverImage})` 
        : 'linear-gradient(to bottom, #4a5ac7, #5a3485)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
    }} />
    
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.8) 80%, white 100%)',
      zIndex: 1
    }} />

    <Box sx={{
      position: 'absolute',
      bottom: -50,
      left: { xs: 24, md: 48 },
      zIndex: 2,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 3
    }}>
      <Avatar
        src={displayData.profileImage}
        sx={{ 
          width: 100,
          height: 100, 
          border: '4px solid white',
          backgroundColor: '#f0f0f0'
        }}
      />
      <Box sx={{ mb: 2 }}>
        <Typography variant="h1" sx={{ 
          fontSize: { xs: '1.8rem', md: '2.5rem' },
          fontWeight: 500,
          mb: 1,
          color: '#000'
        }}>
          {displayData.title}
        </Typography>
        <Typography variant="body1" sx={{ 
          fontSize: { xs: '0.9rem', md: '1.1rem' },
          color: '#1e1e1e',
          maxWidth: '500px'
        }}>
          {displayData.creator?.bio || displayData.description}
        </Typography>
      </Box>
    </Box>
  </Box>
</Box>

     {/* Body Content Container */}
<Box sx={{ 
  maxWidth: '1200px', 
  margin: '0 auto',
  width: '100%'
}}>
  {/* Products Section */}
  <Box sx={{ 
    py: 16, 
    px: { xs: 2, md: 4 },
    backgroundColor: 'white',
    display: 'grid',
    gridTemplateColumns: { md: '1fr 400px' },
    gap: 4
  }}>
    {/* Left Content */}
    <Box>
      <Chip 
        label={displayData.category} 
        sx={{ 
          backgroundColor: '#4a5ac7', 
          color: 'white',
          mb: 3
        }}
      />
      
      <Typography variant="h4" sx={{ mb: 3, color: 'black', fontWeight: 500 }}>
        About This Community
      </Typography>
      <Typography paragraph sx={{ color: 'black' }}>
        {displayData.description}
      </Typography>
    </Box>

    {/* Right Sticky Card */}
    <Box sx={{ position: { md: 'sticky' }, top: 80, alignSelf: 'start' }}>
      <Card sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        p: 3,
        backgroundColor: '#1e1e1e'
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
          Join Community
        </Typography>
        <Typography variant="h4" sx={{ 
  mb: 2, 
  color: 'white', // Changed from '#4a5ac7' to 'white'
  fontWeight: 500 
}}>
  ₦{displayData.price.toLocaleString()}
</Typography>
        <Typography paragraph sx={{ color: 'white', mb: 3 }}>
          Get instant access to this community with all features and benefits.
        </Typography>
        <Button 
  variant="contained" 
  fullWidth
  onClick={onJoinClick} // ADD THIS
  sx={{ 
    mt: 2,
    backgroundColor: '#4a5ac7',
    '&:hover': {
      backgroundColor: '#3a4ab7'
    }
  }}
>
  Join Now
</Button>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ Instant WhatsApp access
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
            ✅ {displayData.paymentType === 'recurring' ? 'Monthly recurring' : 'One-time'} payment
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            ✅ 7-day money back guarantee
          </Typography>
        </Box>
      </Card>
    </Box>
  </Box>
</Box>
</Box>
  );
};

export default StorefrontPage;