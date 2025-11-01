// services/publicService.js
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

export const getCommunityBySpaceName = async (spaceName) => {
  console.log('🔍 Searching for community with spaceName:', spaceName);
  
  try {
    // Convert URL slug back to title format: "mary-nunez" → "Mary Nunez"
    const titleFromSlug = spaceName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    console.log('🔍 Converted slug to title:', titleFromSlug);
    
    // Search by exact title match
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, where('urlSlug', '==', spaceName));
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Query results count:', querySnapshot.size);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      console.log('✅ Found community by title:', doc.data().title);
      return { id: doc.id, ...doc.data() };
    }
    
    // If no title match, try by document ID as fallback
    console.log('🔍 Trying to find by document ID...');
    const communityDoc = await getDoc(doc(db, 'communities', spaceName));
    if (communityDoc.exists()) {
      console.log('✅ Found community by ID:', communityDoc.data().title);
      return { id: communityDoc.id, ...communityDoc.data() };
    }
    
    console.log('❌ No community found');
    return null;
  } catch (error) {
    console.error('🚨 Error fetching community:', error);
    return null;
  }
};