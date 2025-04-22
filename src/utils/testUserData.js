import { testDb, testAuth } from '../firebase/testConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

/**
 * Deletes all test data associated with the current test user, global test data, and the user account itself.
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails at any step.
 */
export const clearTestUserDataAndAccount = async () => {
  const user = testAuth.currentUser;
  if (!user) {
    console.warn("No test user logged in to clear data for.");
    return; // No user to clear
  }

  const userId = user.uid;
  console.log(`Starting data cleanup for test user: ${userId} (${user.email})`);

  // Collections specific to the user
  const userSpecificCollections = [
    { name: 'test_shipments', userIdField: 'userId' },
    { name: 'test_selfTrainings', userIdField: 'userId' },
    // Add other user-specific test collections here if needed
  ];

  // Global test collections to clear completely
  const globalTestCollections = ['test_item_master'];

  try {
    // 1. Delete user-specific data from collections
    for (const coll of userSpecificCollections) {
      console.log(`Querying user-specific collection: ${coll.name} for userId: ${userId}`);
      const q = query(collection(testDb, coll.name), where(coll.userIdField, '==', userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`Found ${querySnapshot.size} documents in ${coll.name} to delete.`);
        const deletePromises = querySnapshot.docs.map(docSnapshot =>
          deleteDoc(doc(testDb, coll.name, docSnapshot.id))
        );
        await Promise.all(deletePromises);
        console.log(`Successfully deleted user-specific documents from ${coll.name}.`);
      } else {
        console.log(`No documents found in ${coll.name} for user ${userId}.`);
      }
    }

    // 2. Delete all data from global test collections
    for (const collName of globalTestCollections) {
        console.log(`Clearing global test collection: ${collName}`);
        const q = query(collection(testDb, collName)); // Query all documents
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            console.log(`Found ${querySnapshot.size} documents in ${collName} to delete.`);
            const deletePromises = querySnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(testDb, collName, docSnapshot.id))
            );
            await Promise.all(deletePromises);
            console.log(`Successfully cleared all documents from ${collName}.`);
        } else {
            console.log(`No documents found in ${collName} to clear.`);
        }
    }


    // 3. Delete the user account from testAuth
    console.log(`Attempting to delete test user account: ${userId}`);
    await deleteUser(user);
    console.log(`Successfully deleted test user account: ${userId}`);

  } catch (error) {
    console.error(`Error during test user data cleanup for ${userId}:`, error);
    // Decide how to handle partial failures. Maybe alert the user?
    // For now, re-throw the error to indicate failure.
    throw new Error(`Failed to completely clear test user data. Error: ${error.message}`);
  }
};
