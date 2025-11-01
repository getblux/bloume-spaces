import { toast } from 'react-toastify';

const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

export const testPaystackConnection = async () => {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      }
    });
    const data = await response.json();
    console.log('Paystack connection test:', data);
    return data.status;
  } catch (error) {
    console.error('Paystack connection failed:', error);
    return false;
  }
};

export const resolveBankAccount = async (accountNumber, bankCode) => {
  try {
    console.log('Resolving bank account:', { accountNumber, bankCode });
    
    const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      }
    });

    console.log('Bank resolution response status:', response.status);
    
    const data = await response.json();
    console.log('Bank resolution full response:', data);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('Bank resolution failed:', error);
    throw error;
  }
};

// List of banks that support subaccounts (traditional banks)
const SUBACCOUNT_SUPPORTED_BANKS = ['057', '058', '011', '033', '032', '035', '044', '063', '050', '070'];

export const createPaystackSubaccount = async (userData, communityData, bankDetails) => {
  try {
    console.log('API Key being used:', PAYSTACK_SECRET_KEY ? 'Present' : 'Missing');
    
    // Test connection first
    const connectionTest = await testPaystackConnection();
    if (!connectionTest) {
      throw new Error('Cannot connect to Paystack API. Check your secret key.');
    }

    // Check if bank supports subaccounts
    const supportsSubaccount = SUBACCOUNT_SUPPORTED_BANKS.includes(bankDetails.bankCode);
    
    if (!supportsSubaccount) {
      console.log('Bank does not support subaccounts, using transaction split instead');
      return await createTransactionSplit(userData, communityData, bankDetails);
    }

    const subaccountData = {
      business_name: communityData.title.substring(0, 100),
      bank_code: bankDetails.bankCode,
      account_number: bankDetails.accountNumber,
      percentage_charge: 15,
      settlement_schedule: 'daily',
      primary_contact_email: userData.email,
      primary_contact_name: userData.name.substring(0, 100),
      metadata: {
        userId: userData.uid,
        communityId: communityData.id
      }
    };

    console.log('Creating subaccount with payload:', subaccountData);

    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subaccountData)
    });

    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Full Paystack response:', data);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.status) {
      throw new Error(data.message || `Paystack API error: ${JSON.stringify(data)}`);
    }

    return {
      subaccountId: data.data.subaccount_code,
      bankVerified: true,
      paystackData: data.data,
      paymentMethod: 'subaccount'
    };
  } catch (error) {
    console.error('Paystack subaccount creation failed:', error);
    // Fallback to transaction split
    console.log('Falling back to transaction split...');
    return await createTransactionSplit(userData, communityData, bankDetails);
  }
};

// NEW: Transaction split for digital banks
export const createTransactionSplit = async (userData, communityData, bankDetails) => {
  try {
    console.log('Creating transaction split for digital bank');
    
    // First create a subaccount for the creator
    const subaccountData = {
      business_name: communityData.title.substring(0, 100),
      bank_code: bankDetails.bankCode,
      account_number: bankDetails.accountNumber,
      percentage_charge: 0, // No percentage charge on subaccount level
      settlement_schedule: 'daily',
      primary_contact_email: userData.email,
      primary_contact_name: userData.name.substring(0, 100),
      metadata: {
        userId: userData.uid,
        communityId: communityData.id
      }
    };

    console.log('Creating subaccount for split...');
    const subaccountResponse = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subaccountData)
    });

    const subaccountResult = await subaccountResponse.json();
    console.log('Subaccount creation response:', subaccountResult);

    if (subaccountResult.status) {
      // Now create the split with the required subaccounts parameter
      const splitData = {
        name: `${communityData.title.substring(0, 50)} - Revenue Share`,
        type: 'percentage',
        currency: 'NGN',
        bearer_type: 'subaccount',
        bearer_subaccount: subaccountResult.data.subaccount_code,
        subaccounts: [ // THIS IS THE REQUIRED PARAMETER
          {
            subaccount: subaccountResult.data.subaccount_code,
            share: 85 // Creator gets 85% of revenue
          }
          // Platform gets the remaining 15% automatically
        ]
      };

      const splitResponse = await fetch('https://api.paystack.co/split', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(splitData)
      });

      const splitResult = await splitResponse.json();
      console.log('Split creation response:', splitResult);

      if (splitResult.status) {
        return {
          subaccountId: subaccountResult.data.subaccount_code,
          splitId: splitResult.data.id,
          bankVerified: true,
          paystackData: splitResult.data,
          paymentMethod: 'split'
        };
      } else {
        console.log('Split creation failed, using subaccount only');
        // Even if split fails, we still have a working subaccount
        return {
          subaccountId: subaccountResult.data.subaccount_code,
          bankVerified: true,
          paymentMethod: 'subaccount'
        };
      }
    } else {
      console.log('Subaccount creation failed, using manual payout');
      return {
        bankVerified: true,
        paymentMethod: 'manual',
        requiresManualPayout: true
      };
    }
  } catch (error) {
    console.error('Transaction split creation failed:', error);
    return {
      bankVerified: true,
      paymentMethod: 'manual',
      requiresManualPayout: true
    };
  }
};

// NEW: Function to handle payments with splits
export const initializePaymentWithSplit = async (email, amount, subaccountId, splitId) => {
  try {
    const paymentData = {
      email: email,
      amount: amount * 100, // Convert to kobo
      currency: 'NGN',
      subaccount: subaccountId,
      split_code: splitId, // Only if using transaction split
      metadata: {
        custom_fields: [
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: "community_access"
          }
        ]
      }
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
};