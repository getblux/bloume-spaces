import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    limit,
    Timestamp
  } from 'firebase/firestore';
  
  const db = getFirestore();
  
  const getTimeRanges = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      startOfToday: Timestamp.fromDate(startOfToday),
      startOfWeek: Timestamp.fromDate(startOfWeek),
      startOfMonth: Timestamp.fromDate(startOfMonth)
    };
  };
  
  export const getStorePerformance = async (storeId) => {
    try {
      const { startOfToday, startOfWeek } = getTimeRanges();
      const ordersRef = collection(db, 'stores', storeId, 'orders');
      
      const todayQuery = query(
        ordersRef, 
        where('createdAt', '>=', startOfToday),
        where('status', '==', 'completed')
      );
      
      const weekQuery = query(
        ordersRef,
        where('createdAt', '>=', startOfWeek),
        where('status', '==', 'completed')
      );
  
      const [todaySnapshot, weekSnapshot] = await Promise.all([
        getDocs(todayQuery),
        getDocs(weekQuery)
      ]);
  
      const todayRevenue = todaySnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
      const weekRevenue = weekSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
  
      return {
        todayOrders: todaySnapshot.size,
        todayRevenue,
        weekRevenue,
        totalOrders: weekSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching store performance:', error);
      return { todayOrders: 0, todayRevenue: 0, weekRevenue: 0, totalOrders: 0 };
    }
  };
  
  export const getBestSellingProducts = async (storeId) => {
    try {
      const productsRef = collection(db, 'stores', storeId, 'products');
      const productsQuery = query(productsRef, orderBy('salesCount', 'desc'), limit(5));
      
      const snapshot = await getDocs(productsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Product',
        sales: doc.data().salesCount || 0,
        revenue: doc.data().revenue || 0
      }));
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      return [];
    }
  };
  
  export const getLowStockProducts = async (storeId) => {
    try {
      const productsRef = collection(db, 'stores', storeId, 'products');
      const lowStockQuery = query(productsRef, where('stock', '<=', 5));
      
      const snapshot = await getDocs(lowStockQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Product',
        stock: doc.data().stock || 0,
        threshold: 5
      }));
    } catch (error) {
      console.error('Error fetching low stock:', error);
      return [];
    }
  };
  
  export const getTodaysOrders = async (storeId) => {
    try {
      const { startOfToday } = getTimeRanges();
      const ordersRef = collection(db, 'stores', storeId, 'orders');
      const todayQuery = query(
        ordersRef, 
        where('createdAt', '>=', startOfToday),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(todayQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().customerName || 'Customer',
        total: doc.data().total || 0,
        status: doc.data().status || 'pending',
        items: doc.data().items || []
      }));
    } catch (error) {
      console.error('Error fetching today orders:', error);
      return [];
    }
  };
  
  export const getRecentCustomers = async (storeId) => {
    try {
      const { startOfWeek } = getTimeRanges();
      const customersRef = collection(db, 'stores', storeId, 'customers');
      const recentQuery = query(
        customersRef, 
        where('firstSeen', '>=', startOfWeek),
        orderBy('firstSeen', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(recentQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Customer',
        email: doc.data().email || '',
        orders: doc.data().orderCount || 0,
        totalSpent: doc.data().totalSpent || 0
      }));
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      return [];
    }
  };
  
  // Additional useful queries
  export const getPendingOrders = async (storeId) => {
    try {
      const ordersRef = collection(db, 'stores', storeId, 'orders');
      const pendingQuery = query(
        ordersRef, 
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(pendingQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().customerName || 'Customer',
        total: doc.data().total || 0,
        createdAt: doc.data().createdAt
      }));
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }
  };
  
  export const getSalesData = async (storeId, period = 'week') => {
    try {
      const { startOfWeek, startOfMonth } = getTimeRanges();
      const startDate = period === 'month' ? startOfMonth : startOfWeek;
      
      const ordersRef = collection(db, 'stores', storeId, 'orders');
      const salesQuery = query(
        ordersRef,
        where('createdAt', '>=', startDate),
        where('status', '==', 'completed')
      );
      
      const snapshot = await getDocs(salesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        total: doc.data().total || 0,
        createdAt: doc.data().createdAt
      }));
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
  };