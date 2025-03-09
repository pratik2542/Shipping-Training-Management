import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';

// Sample initial data
const initialItemData = [
  { item_no: '3456', item_name: 'Vitamin C Tablets', UOM: 'KG' },
  { item_no: '4123', item_name: 'Calcium Capsules', UOM: 'EA' },
  { item_no: '5678', item_name: 'Omega-3 Fish Oil', UOM: 'Cylinder' },
  { item_no: '8901', item_name: 'Vitamin D Drops', UOM: 'EA' },
  { item_no: '2345', item_name: 'Protein Powder', UOM: 'KG' },
  { item_no: '7890', item_name: 'Multivitamin Complex', UOM: 'EA' },
];

/**
 * Initialize the item master data collection if it doesn't exist
 * @returns {Promise<void>}
 */
const initializeItemMasterData = async () => {
  try {
    // Check if we're dealing with a test user
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    console.log(`Initializing ${isTestUser ? 'test ' : ''}item master data...`);
    
    // Check if data already exists
    const existingData = await getDocs(collection(dbInstance, collectionName));
    
    if (existingData.empty) {
      console.log(`No existing data found in ${collectionName}, initializing...`);
      
      // Add batch of items
      const addPromises = initialItemData.map(item => 
        addDoc(collection(dbInstance, collectionName), {
          ...item,
          isTestData: isTestUser, // Flag to identify test data
          createdAt: new Date().toISOString(),
          active: true
        })
      );
      
      await Promise.all(addPromises);
      console.log(`Item master data initialized successfully in ${collectionName}`);
    } else {
      console.log(`Item master data already exists in ${collectionName} (${existingData.size} items found)`);
    }
  } catch (error) {
    console.error('Error initializing item master data:', error);
    throw error; // Re-throw to handle in calling code
  }
};

/**
 * Get all items from the master data collection
 * @returns {Promise<Array>} Array of item objects
 */
const getAllItems = async () => {
  try {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    console.log(`Fetching items from ${collectionName}`);
    const querySnapshot = await getDocs(collection(dbInstance, collectionName));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
};

/**
 * Get item details by item number
 * @param {string} itemNo - The item number to look up
 * @returns {Promise<Object|null>} Item object or null if not found
 */
const getItemByNumber = async (itemNo) => {
  try {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    const q = query(
      collection(dbInstance, collectionName),
      where('item_no', '==', itemNo)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error fetching item with number ${itemNo}:`, error);
    return null;
  }
};

// Create a single export object with all the functions
const itemMasterUtils = {
  initializeItemMasterData,
  getAllItems,
  getItemByNumber
};

// Export both the default object and named functions
export { initializeItemMasterData, getAllItems, getItemByNumber };
export default itemMasterUtils;
