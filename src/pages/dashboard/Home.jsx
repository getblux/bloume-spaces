import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  TextField, 
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { processAIRequest } from '../../utils/aiHandlers';

const MobileContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const DesktopContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(2),
  maxWidth: '800px',
  margin: '0 auto',
}));

const GradientOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '120px',
  background: `linear-gradient(to top, ${theme.palette.background.default} 70%, transparent 100%)`,
  pointerEvents: 'none',
}));


const BottomInputContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.divider}`,
  zIndex: 1,
  minHeight: '88px',
  display: 'flex',
  alignItems: 'flex-end',
}));

const ActionButton = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 3),
  margin: theme.spacing(0.5),
  borderRadius: '50px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  cursor: 'pointer',
  textAlign: 'center',
  fontSize: '12px',
  fontWeight: 400,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const HorizontalActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 1,
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  maxWidth: '500px',
  width: '100%',
}));

const Home = () => {
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const storeName = 'lumen';
          const storeRef = doc(db, 'stores', storeName.toLowerCase());
          const storeSnapshot = await getDoc(storeRef);
          
          if (storeSnapshot.exists()) {
            const storeData = storeSnapshot.data();
            const firstName = storeData.ownerName?.trim().split(' ')[0] || 'there';
            setFirstName(firstName);
            
            const userIsNew = !storeData.hasProducts || storeData.isNewUser || true;
            
            setIsNewUser(userIsNew);
            
           if (userIsNew) {
  setMessages([
    {
      id: 1,
      type: 'ai',
      content: `Hi ${firstName}! 🎉 Your store is live now. I'm your AI assistant to help you grow.`,
      timestamp: new Date(),
      quickReplies: ['Store performance', 'Add products', 'Today orders', 'Help']
    }
  ]);
} else {
  setMessages([
    {
      id: 1,
      type: 'ai',
      content: `Hey ${firstName}! 👋 Ready to grow your store today?`,
      timestamp: new Date(),
      quickReplies: ['Store performance', 'Best sellers', 'Today orders', 'Low stock']
    }
  ]);
}
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [auth, db]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAIThinking(true); // Start loading

    const aiResponse = await generateAIResponse(inputMessage);
    setMessages(prev => [...prev, aiResponse]);
    setIsAIThinking(false); // Stop loading
    
    if (aiResponse.action && aiResponse.action.startsWith('navigate:')) {
      const route = aiResponse.action.split(':')[1];
      setTimeout(() => navigate(route), 1000);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAction = async (action) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: action,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const aiResponse = await generateAIResponse(action);
    setMessages(prev => [...prev, aiResponse]);
    
    if (aiResponse.action && aiResponse.action.startsWith('navigate:')) {
      const route = aiResponse.action.split(':')[1];
      setTimeout(() => navigate(route), 1000);
    }
  };

  const generateAIResponse = async (userInput) => {
    console.log('=== AI DEBUG ===');
    console.log('User input:', userInput);
    console.log('First name:', firstName);
    
    try {
      // Get storeId from your store data
      const storeId = 'lumen'; // Replace with dynamic store ID from your data
      const response = await processAIRequest(userInput, firstName, storeId);
      console.log('AI Response:', response);
      return response;
    } catch (error) {
      console.error('AI Error:', error);
      return {
        id: Date.now() + 1,
        type: 'ai', 
        content: `Hi ${firstName}! How can I help with your store today?`,
        quickReplies: ['Store performance', 'Best sellers', 'Today orders', 'Help']
      };
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setInputMessage(prev => prev + '\n');
    }
  };

  const renderInputField = () => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', width: '100%', maxWidth: '600px' }}>
      <TextField
        fullWidth
        variant="filled"
        placeholder="Type your message..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        multiline
        maxRows={5}
        sx={{
          '& .MuiFilledInput-root': {
            padding: '0 !important',
            alignItems: 'flex-end',
            minHeight: '52px',
          },
          '& .MuiInputBase-input': {
            padding: '16px',
            paddingRight: '60px',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }
        }}
        InputProps={{
          endAdornment: (
            <Box sx={{ position: 'absolute', right: '8px', bottom: '8px' }}>
              <IconButton 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '&:disabled': {
                    backgroundColor: theme.palette.action.disabled,
                  }
                }}
              >
                <PaperPlaneRight size={20} />
              </IconButton>
            </Box>
          ),
        }}
      />
    </Box>
  );

  const TypingIndicator = () => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ 
        backgroundColor: 'background.level2',
        borderRadius: '0px 15px 15px 15px',
        padding: 2,
      }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: 'text.secondary',
            animation: 'pulse 1.5s ease-in-out infinite' 
          }} />
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: 'text.secondary',
            animation: 'pulse 1.5s ease-in-out 0.5s infinite' 
          }} />
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: 'text.secondary',
            animation: 'pulse 1.5s ease-in-out 1s infinite' 
          }} />
        </Box>
      </Box>
    </Box>
  );
  
  // Add CSS animation
  const globalStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  `;

  const renderMessageBubble = (message) => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
      mb: 2 
    }}>
      <Box sx={{ 
        backgroundColor: message.type === 'user' ? theme.palette.primary.main : theme.palette.background.level2,
        color: message.type === 'user' ? 'white' : theme.palette.text.secondary,
        borderRadius: message.type === 'user' ? '15px 0px 15px 15px' : '0px 15px 15px 15px',
        padding: 2,
        maxWidth: '85%',
        mb: message.quickReplies ? 1 : 0
      }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {message.content}
        </Typography>
      </Box>
      
      {message.quickReplies && (
        <Box sx={{ 
          maxWidth: '85%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Box sx={{ display: 'flex', gap: 0.5, minWidth: 'min-content' }}>
            {message.quickReplies.map((action) => (
              <ActionButton 
                key={action} 
                onClick={() => handleQuickAction(action)}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                {action}
              </ActionButton>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
  
  if (isMobile) {
    return (
      <MobileContainer>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pb: 10, pt: 5 }}>
          {messages.map((message) => renderMessageBubble(message))}
          {isAIThinking && <TypingIndicator />}
        </Box>
        <BottomInputContainer>
          {renderInputField()}
        </BottomInputContainer>
      </MobileContainer>
    );
  }
  
  return (
    <DesktopContainer>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pb: 10, pt: 4 }}>
        {messages.map((message) => renderMessageBubble(message))}
        {isAIThinking && <TypingIndicator />}
      </Box>
      <Box sx={{ width: '100%', maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1, minHeight: '88px', display: 'flex', alignItems: 'flex-end' }}>
        {renderInputField()}
      </Box>
    </DesktopContainer>
  );
};

export default Home;