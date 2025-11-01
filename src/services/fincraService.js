const axios = require('axios');

// Create virtual account for user
const createVirtualAccount = async (userData) => {
  try {
    const response = await axios.post(
      'https://sandboxapi.fincra.com/profile/virtual-accounts/requests',
      {
        currency: "NGN",
        accountType: "individual", // or "business"
        KYCInformation: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          bvn: userData.bvn // required for NGN accounts
        }
      },
      {
        headers: {
          'api-key': process.env.FINCRA_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating virtual account:', error.response?.data);
    throw error;
  }
};

// Example usage
const userData = {
  firstName: "John",
  lastName: "Doe", 
  email: "john@example.com",
  bvn: "12345678901" // test BVN for sandbox
};

createVirtualAccount(userData)
  .then(account => console.log('Virtual account:', account))
  .catch(err => console.error('Failed:', err));