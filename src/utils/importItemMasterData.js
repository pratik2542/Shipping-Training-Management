import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';

// Data from your Excel file
const excelItemData = [
  { id: 1, item_no: '3456', item_name: 'Vitamin C Tablets', UOM: 'kg' },
  { id: 2, item_no: '4123', item_name: 'Calcium Capsules', UOM: 'each' },
  { id: 3, item_no: '5678', item_name: 'Omega-3 Fish Oil', UOM: 'cylinders' },
  // Additional data can be added here
];

/**
 * Import item master data from Excel (manual implementation)
 * @returns {Promise<void>}
 */
const importItemMasterData = async () => {
  try {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    console.log('Starting item master data import...');
    
    // Check if collection exists and has any data
    const existingData = await getDocs(collection(dbInstance, collectionName));
    
    if (!existingData.empty) {
      console.log('Item master data already exists. Skipping import.');
      return;
    }
    
    // If no data exists, import from our Excel data array
    const importPromises = excelItemData.map(item => 
      addDoc(collection(dbInstance, collectionName), {
        item_no: item.item_no,
        item_name: item.item_name,
        UOM: item.UOM,
        isTestData: isTestUser,
        createdAt: new Date().toISOString(),
        importedFrom: 'excel',
        active: true
      })
    );
    
    await Promise.all(importPromises);
    console.log(`Successfully imported ${excelItemData.length} items to Firestore`);
    
  } catch (error) {
    console.error('Error importing item master data:', error);
    throw error; // Re-throw for error handling
  }
};

/**
 * Upload a single item to the item master collection
 * @param {Object} item - The item to upload
 * @returns {Promise<string>} - The ID of the newly created document
 */
const addItemToMaster = async (item) => {
  try {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    // Check if item with same number already exists
    const duplicateCheck = query(
      collection(dbInstance, collectionName),
      where('item_no', '==', item.item_no)
    );
    const existingItems = await getDocs(duplicateCheck);
    
    if (!existingItems.empty) {
      throw new Error(`Item with number ${item.item_no} already exists`);
    }
    
    // Add item to collection
    const docRef = await addDoc(collection(dbInstance, collectionName), {
      ...item,
      isTestData: isTestUser,
      createdAt: new Date().toISOString(),
      active: true
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding item to master data:', error);
    throw error;
  }
};

/**
 * Bulk upload items to the item master collection
 * @param {Array} items - Array of items to upload
 * @returns {Promise<Array>} - Array of IDs of the newly created documents
 */
const bulkUploadItems = async (items) => {
  try {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const dbInstance = isTestUser ? testDb : db;
    const collectionName = isTestUser ? 'test_item_master' : 'item_master';
    
    console.log(`Bulk uploading to ${collectionName} (Test user: ${isTestUser})`);
    
    // Process items in batches
    const results = [];
    const batchSize = 20; // Process 20 items at a time
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        try {
          // Check for duplicates first
          const duplicateCheck = query(
            collection(dbInstance, collectionName),
            where('item_no', '==', item.item_no)
          );
          const existingItems = await getDocs(duplicateCheck);
          
          if (existingItems.empty) {
            // Add new item
            const docRef = await addDoc(collection(dbInstance, collectionName), {
              ...item,
              isTestData: isTestUser,
              createdAt: new Date().toISOString(),
              active: true
            });
            return { id: docRef.id, status: 'success', item_no: item.item_no };
          } else {
            // Skip duplicate
            return { id: null, status: 'duplicate', item_no: item.item_no };
          }
        } catch (error) {
          // Log error for this item
          return { id: null, status: 'error', item_no: item.item_no, error: error.message };
        }
      });
      
      // Wait for this batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Short delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Log summary
    const successful = results.filter(r => r.status === 'success').length;
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`Bulk upload complete: ${successful} added, ${duplicates} duplicates, ${errors} errors`);
    
    return results;
  } catch (error) {
    console.error('Error in bulk upload:', error);
    throw error;
  }
};

// Create the utilities object
const importItemMasterUtils = {
  importItemMasterData,
  addItemToMaster,
  bulkUploadItems
};

// Export each function individually and as a default object
export { importItemMasterData, addItemToMaster, bulkUploadItems };
export default importItemMasterUtils;
