import { todoAPI } from '../services/todoService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('todoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodos', () => {
    test('fetches todos successfully', async () => {
      const mockTodos = [{ id: 1, title: 'Test todo', completed: false }];
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockTodos }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const result = await todoAPI.getTodos();
      expect(result).toEqual(mockTodos);
    });

    test('handles API errors', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Network error')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      await expect(todoAPI.getTodos()).rejects.toThrow('Failed to fetch todos: Network error');
    });
  });

  describe('createTodo', () => {
    test('creates todo successfully', async () => {
      const newTodo = { title: 'New todo', completed: false, userId: 1 };
      const createdTodo = { id: 1, ...newTodo };
      
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: createdTodo }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const result = await todoAPI.createTodo(newTodo);
      expect(result).toEqual(createdTodo);
    });
  });

  describe('updateTodo', () => {
    test('updates todo successfully', async () => {
      const updatedTodo = { id: 1, title: 'Updated todo', completed: true, userId: 1 };
      
      mockedAxios.create.mockReturnValue({
        put: jest.fn().mockResolvedValue({ data: updatedTodo }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const result = await todoAPI.updateTodo(1, updatedTodo);
      expect(result).toEqual(updatedTodo);
    });
  });

  describe('deleteTodo', () => {
    test('deletes todo successfully', async () => {
      mockedAxios.create.mockReturnValue({
        delete: jest.fn().mockResolvedValue({}),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const result = await todoAPI.deleteTodo(1);
      expect(result).toBe(true);
    });
  });
});
