const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-va', async (req, res) => {
    try {
      const { firstName, lastName, email, bvn } = req.body;
  
      const response = await axios.post(
        'https://sandboxapi.fincra.com/profile/virtual-accounts/requests',
        {
          currency: "NGN",
          accountType: "individual",
          KYCInformation: {
            firstName: firstName,
            lastName: lastName,
            email: email,
            bvn: bvn || "12345678901" // Use test BVN if not provided
          }
        },
        {
          headers: {
            'api-key': process.env.FINCRA_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
  
      res.json({ success: true, account: response.data });
    } catch (error) {
      console.error('Fincra error:', error.response?.data);
      res.status(500).json({ 
        success: false, 
        error: error.response?.data || error.message 
      });
    }
  });

  // User registration endpoint
app.post('/register', async (req, res) => {
    try {
      const { name, email, password, spaceName } = req.body;
  
      // 1. Create virtual account with Fincra
      const vaResponse = await axios.post(
        'https://sandboxapi.fincra.com/profile/virtual-accounts/requests',
        {
          currency: "NGN",
          accountType: "individual",
          KYCInformation: {
            firstName: name.split(' ')[0],
            lastName: name.split(' ')[1] || 'User',
            email: email,
            bvn: "12345678901" // Use test BVN for now
          }
        },
        {
          headers: {
            'api-key': process.env.FINCRA_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // 2. Generate user ID (replace Firebase Auth UID)
      const userId = 'user_' + Date.now();
  
      // 3. Store user data (replace Firestore)
      const userData = {
        userId: userId,
        name: name,
        email: email,
        spaceName: spaceName.toLowerCase(),
        virtualAccount: vaResponse.data,
        createdAt: new Date()
      };
  
      // Here you would save to your database (MongoDB, PostgreSQL, etc.)
      // For now, we'll just return the data
      console.log('User registered:', userData);
  
      res.json({ 
        success: true, 
        user: userData 
      });
      
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      res.status(500).json({ 
        success: false, 
        error: error.response?.data || error.message 
      });
    }
  });

  // Check if store name is available
app.get('/check-store/:storeName', async (req, res) => {
    try {
      const { storeName } = req.params;
      
      // TODO: Replace with your database check later
      // For now, we'll simulate availability check
      const isAvailable = Math.random() > 0.5; // Random for testing
      
      res.json({ 
        success: true, 
        available: isAvailable,
        storeName: storeName.toLowerCase()
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Fincra webhook endpoint
app.post('/webhook/fincra', async (req, res) => {
    try {
      console.log('📩 Fincra webhook received:', req.body);
      
      // Verify webhook signature (important for security)
      const signature = req.headers['x-fincra-signature'];
      // Add signature verification logic here
      
      const event = req.body;
      
      // Handle different webhook events
      switch (event.event) {
        case 'virtualaccount.credit':
          console.log('💳 Virtual account credited:', event);
          // Update user balance in your database
          break;
          
        case 'payout.success':
          console.log('💰 Payout successful:', event);
          // Update payout status in your database
          break;
          
        default:
          console.log('🔔 Unknown event:', event.event);
      }
      
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});