import { routeAIRequest } from './aiRouter';
import { detectIntent } from './intentDetector';
import { groqChat } from './groqClient';
import { 
  getStorePerformance, 
  getBestSellingProducts, 
  getLowStockProducts, 
  getTodaysOrders, 
  getRecentCustomers,
  getPendingOrders 
} from './storeDataQueries';

export const handleGroqChat = async (userInput, firstName) => {
  console.log('Using Groq for:', userInput);
  try {
    return await groqChat(userInput, firstName);
  } catch (error) {
    console.error('Groq error:', error);
    return "I'm doing great! 😊 How can I help with your store today?";
  }
};

// Main store command handler with intent support
export const handleStoreCommand = async (userInput, firstName, storeId, intent = null) => {
  // Use intent if provided, otherwise detect from input
  const detectedIntent = intent || detectIntent(userInput);
  const command = userInput.toLowerCase();
  
  console.log('Handling store command with intent:', detectedIntent);
  
  // Handle based on detected intent
  switch (detectedIntent) {
    case 'PERFORMANCE':
      const performance = await getStorePerformance(storeId);
      return {
        content: `📊 Your store performance:\n\n• Today's Orders: ${performance.todayOrders}\n• Today's Revenue: ₦${performance.todayRevenue}\n• Weekly Revenue: ₦${performance.weekRevenue}`,
        quickReplies: ['Best sellers', 'Today orders', 'Low stock', 'Help']
      };
    
    case 'BEST_SELLERS':
      const bestSellers = await getBestSellingProducts(storeId);
      if (bestSellers.length === 0) {
        return {
          content: `No sales data yet. Start adding products and making sales!`,
          quickReplies: ['Add product', 'Store performance', 'Today orders']
        };
      }
      const productList = bestSellers.map(p => `• ${p.name}: ${p.sales} sold`).join('\n');
      return {
        content: `🏆 Your best-selling products:\n\n${productList}`,
        quickReplies: ['Add product', 'View inventory', 'Store analytics']
      };
      
    case 'INVENTORY':
      const lowStock = await getLowStockProducts(storeId);
      if (lowStock.length === 0) {
        return {
          content: `✅ All products are well stocked!`,
          quickReplies: ['Add product', 'Best sellers', 'Store analytics']
        };
      }
      const stockList = lowStock.map(p => `• ${p.name}: ${p.stock} left`).join('\n');
      return {
        content: `⚠️ Low stock alerts:\n\n${stockList}`,
        quickReplies: ['Add product', 'View inventory', 'Store analytics']
      };
      
    case 'ORDERS':
      const orders = await getTodaysOrders(storeId);
      if (orders.length === 0) {
        return {
          content: `No orders today yet. Let's promote your store!`,
          quickReplies: ['Add product', 'Store performance', 'Best sellers']
        };
      }
      const orderList = orders.map(o => `• Order #${o.id.slice(-4)}: ₦${o.total}`).join('\n');
      return {
        content: `📦 Today's orders (${orders.length}):\n\n${orderList}`,
        quickReplies: ['Store performance', 'Best sellers', 'Low stock']
      };
      
    case 'CUSTOMERS':
      const customers = await getRecentCustomers(storeId);
      if (customers.length === 0) {
        return {
          content: `No recent customers yet. Your first customer is on the way!`,
          quickReplies: ['Store performance', 'Best sellers', 'Today orders']
        };
      }
      const customerList = customers.map(c => `• ${c.name}: ${c.orders} orders`).join('\n');
      return {
        content: `👥 Recent customers:\n\n${customerList}`,
        quickReplies: ['Store performance', 'Best sellers', 'Today orders']
      };
      
    default:
      // Fallback to pattern matching if no intent detected
      return handleStoreCommandFallback(command, firstName, storeId);
  }
};

// Fallback handler using pattern matching
const handleStoreCommandFallback = async (command, firstName, storeId) => {
  // Your existing pattern matching logic here
  if (command.includes('add product')) {
    return {
      content: `I'll help you add a new product! Let me take you to the products page.`,
      action: 'navigate:/dashboard/products',
      quickReplies: ['Best sellers', 'Low stock', 'Store analytics', 'Back to main']
    };
  }
  
  if (command.includes('show products') || command.includes('view products')) {
    return {
      content: `Here are your current products. Taking you to the products page.`,
      action: 'navigate:/dashboard/products', 
      quickReplies: ['Add product', 'Best sellers', 'Low stock', 'Back to main']
    };
  }
  
  // ... include all your other existing patterns
  
  // Default fallback
  return {
    content: `I can help you with store analytics, products, orders, and customers. Try "How's business today?" or "What's selling well?"`,
    quickReplies: ['Store performance', 'Best sellers', 'Today orders', 'Low stock']
  };
};

// Main AI processor
export const processAIRequest = async (userInput, firstName, storeId) => {
  const route = routeAIRequest(userInput, { firstName });
  
  switch (route.handler) {
    case 'PREDEFINED':
      const commandResult = await handleStoreCommand(userInput, firstName, storeId, route.intent);
      return { 
        type: 'ai', 
        ...commandResult
      };
      
    case 'GROQ':
    default:
      const groqReply = await handleGroqChat(userInput, firstName);
      return { 
        type: 'ai', 
        content: groqReply,
        quickReplies: getSmartQuickReplies(userInput)
      };
  }
};

// Smart quick replies based on user input
const getSmartQuickReplies = (userInput) => {
  const input = userInput.toLowerCase();
  
  if (input.includes('business') || input.includes('sales') || input.includes('performance')) {
    return ['Store performance', 'Today orders', 'Best sellers', 'Help'];
  }
  if (input.includes('product') || input.includes('selling') || input.includes('inventory')) {
    return ['Best sellers', 'Low stock', 'Add product', 'Store analytics'];
  }
  if (input.includes('order') || input.includes('customer') || input.includes('shipping')) {
    return ['Today orders', 'Pending orders', 'Recent customers', 'Help'];
  }
  
  return ['Store performance', 'Best sellers', 'Today orders', 'Help'];
};