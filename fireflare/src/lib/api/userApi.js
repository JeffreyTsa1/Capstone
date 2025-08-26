/**
 * User-related API functions
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Checks if a user exists in the database and returns user data
 * @param {string} userId - The Auth0 user ID to check
 * @returns {Promise<Object>} - Object containing user data and status
 */
export const checkUserInDatabase = async (userId) => {
  if (!userId) {
    return { exists: false, error: "No user ID provided" };
  }
  
  console.log("Checking if user exists in database:", userId);
  
  try {
    // Check if user exists in Users collection
    const userResponse = await fetch(`${API_URL}/users/check/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (userResponse.status === 200) {
      const userData = await userResponse.json();
      console.log("User data from Users collection:", userData);
      
      if (userData.exists) {
        return {
          exists: true,
          isModerator: userData.type === 'moderator',
          user: userData.user
        };
      }
    }
    
    // User doesn't exist
    console.log("User not found in database");
    return { exists: false };
    
  } catch (error) {
    console.error("Error checking user in database:", error);
    return { exists: false, error: error.message };
  }
};

/**
 * Create a new user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} - Created user data or error
 */
export const createUser = async (userData) => {
  if (!userData || !userData.userID) {
    return { error: "Invalid user data" };
  }
  
  try {
    const response = await fetch(`${API_URL}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return { success: true, user: result.user };
    } else {
      return { success: false, error: result.error || "Failed to create user" };
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing user's information
 * @param {Object} userData - User data with updates
 * @returns {Promise<Object>} - Success status and message
 */
export const updateUser = async (userData) => {
  if (!userData || !userData.userID) {
    return { success: false, error: "User ID required" };
  }
  
  console.log("Updating user with data:", userData);
  try {
    const response = await fetch(`${API_URL}/users/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return { 
        success: true, 
        message: result.message || "User updated successfully",
        addressesCount: result.addressesCount 
      };
    } else {
      return { success: false, error: result.error || "Failed to update user" };
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get addresses for a specific user
 * @param {string} userId - The user ID to fetch addresses for
 * @returns {Promise<Object>} - User addresses or error
 */
export const getUserAddresses = async (userId) => {
  if (!userId) {
    return { success: false, error: "User ID required" };
  }
  
  try {
    const response = await fetch(`${API_URL}/users/addresses/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return { 
        success: true, 
        addresses: result.addresses || [] 
      };
    } else {
      return { success: false, error: result.error || "Failed to fetch addresses" };
    }
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return { success: false, error: error.message, addresses: [] };
  }
};
