import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

// Save user after OTP verification
export const saveUserToFirestore = async (userData) => {
  try {
    const userRef = doc(db, 'users', userData.email);
    await setDoc(userRef, {
      name: userData.name,
      email: userData.email,
      spaceName: userData.spaceName,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

// Get user by email
export const getUserFromFirestore = async (email) => {
  try {
    const userRef = doc(db, 'users', email);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Get all users (for admin)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = [];
    querySnapshot.forEach((doc) => {
      usersList.push({ id: doc.id, ...doc.data() });
    });
    return usersList;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};