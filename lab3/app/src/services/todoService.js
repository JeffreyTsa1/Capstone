import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for debugging and adding auth tokens)
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor (for debugging and error handling)
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Todo API functions
export const todoAPI = {
  // Fetch all todos
  getTodos: async () => {
    try {
      const response = await apiClient.get('/todos');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch todos: ${error.message}`);
    }
  },

  // Fetch a single todo by ID
  getTodoById: async (id) => {
    try {
      const response = await apiClient.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch todo ${id}: ${error.message}`);
    }
  },

  // Create a new todo
  createTodo: async (todoData) => {
    try {
      const response = await apiClient.post('/todos', todoData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create todo: ${error.message}`);
    }
  },

  // Update a todo
  updateTodo: async (id, todoData) => {
    try {
      const response = await apiClient.put(`/todos/${id}`, todoData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update todo ${id}: ${error.message}`);
    }
  },

  // Delete a todo
  deleteTodo: async (id) => {
    try {
      await apiClient.delete(`/todos/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete todo ${id}: ${error.message}`);
    }
  },

  // Fetch todos by user ID
  getTodosByUser: async (userId) => {
    try {
      const response = await apiClient.get(`/todos?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch todos for user ${userId}: ${error.message}`);
    }
  }
};

// Alternative using Fetch API (for comparison)
export const todoAPIFetch = {
  getTodos: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch todos: ${error.message}`);
    }
  },

  createTodo: async (todoData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create todo: ${error.message}`);
    }
  }
};

export default apiClient;
