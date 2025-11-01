const functions = require('firebase-functions');
const axios = require('axios');

const config = functions.config();

const createVirtualAccount = async (userData) => {
  try {
    const response = await axios.post(
      'https://sandboxapi.fincra.com/profile/virtual-accounts/requests',
      {
        currency: "NGN",
        accountType: "individual", 
        KYCInformation: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          bvn: userData.bvn
        }
      },
      {
        headers: {
          'api-key': config.fincra.secret_key, // ← Uses config now
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Fincra API Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { createVirtualAccount };