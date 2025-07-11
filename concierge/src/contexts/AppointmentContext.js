'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  clientQueue: [],
  appointments: [],
  isLoading: false,
  lastSaved: null,
  pendingChanges: []
};

// Action types
const ACTIONS = {
  SET_CLIENT_QUEUE: 'SET_CLIENT_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  ADD_APPOINTMENT: 'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
  SET_LOADING: 'SET_LOADING',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  ADD_PENDING_CHANGE: 'ADD_PENDING_CHANGE',
  CLEAR_PENDING_CHANGES: 'CLEAR_PENDING_CHANGES'
};

// Reducer
function appointmentReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CLIENT_QUEUE:
      return { ...state, clientQueue: action.payload };
    
    case ACTIONS.REMOVE_FROM_QUEUE:
      return {
        ...state,
        clientQueue: state.clientQueue.filter(client => client.id !== action.payload),
        pendingChanges: [...state.pendingChanges, { type: 'REMOVE_FROM_QUEUE', clientId: action.payload, timestamp: Date.now() }]
      };
    
    case ACTIONS.ADD_TO_QUEUE:
      return {
        ...state,
        clientQueue: [...state.clientQueue, action.payload],
        pendingChanges: [...state.pendingChanges, { type: 'ADD_TO_QUEUE', client: action.payload, timestamp: Date.now() }]
      };
    
    case ACTIONS.ADD_APPOINTMENT:
      return {
        ...state,
        appointments: [...state.appointments, action.payload],
        pendingChanges: [...state.pendingChanges, { type: 'ADD_APPOINTMENT', appointment: action.payload, timestamp: Date.now() }]
      };
    
    case ACTIONS.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(apt => 
          apt.id === action.payload.id ? { ...apt, ...action.payload } : apt
        ),
        pendingChanges: [...state.pendingChanges, { type: 'UPDATE_APPOINTMENT', appointment: action.payload, timestamp: Date.now() }]
      };
    
    case ACTIONS.DELETE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.filter(apt => apt.id !== action.payload),
        pendingChanges: [...state.pendingChanges, { type: 'DELETE_APPOINTMENT', appointmentId: action.payload, timestamp: Date.now() }]
      };
    
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ACTIONS.SET_LAST_SAVED:
      return { ...state, lastSaved: action.payload };
    
    case ACTIONS.ADD_PENDING_CHANGE:
      return { ...state, pendingChanges: [...state.pendingChanges, action.payload] };
    
    case ACTIONS.CLEAR_PENDING_CHANGES:
      return { ...state, pendingChanges: [] };
    
    default:
      return state;
  }
}

// Context
const AppointmentContext = createContext();

// Provider component
export function AppointmentProvider({ children }) {
  const [state, dispatch] = useReducer(appointmentReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-save pending changes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.pendingChanges.length > 0) {
        savePendingChanges();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.pendingChanges]);

  // Save changes when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.pendingChanges.length > 0) {
        savePendingChanges();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.pendingChanges]);

  const loadInitialData = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      // Replace with your actual API calls
      const [queueData, appointmentsData] = await Promise.all([
        fetch('/api/client-queue').then(res => res.json()),
        fetch('/api/appointments').then(res => res.json())
      ]);
      
      dispatch({ type: ACTIONS.SET_CLIENT_QUEUE, payload: queueData });
      // Set appointments if you have them
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const savePendingChanges = async () => {
    if (state.pendingChanges.length === 0) return;

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      // Send all pending changes to the server
      await fetch('/api/appointments/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: state.pendingChanges,
          timestamp: Date.now()
        })
      });

      dispatch({ type: ACTIONS.CLEAR_PENDING_CHANGES });
      dispatch({ type: ACTIONS.SET_LAST_SAVED, payload: Date.now() });
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  const removeFromQueue = (clientId) => {
    dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: clientId });
  };

  const addToQueue = (client) => {
    dispatch({ type: ACTIONS.ADD_TO_QUEUE, payload: client });
  };

  const addAppointment = (appointment) => {
    dispatch({ type: ACTIONS.ADD_APPOINTMENT, payload: appointment });
  };

  const updateAppointment = (appointment) => {
    dispatch({ type: ACTIONS.UPDATE_APPOINTMENT, payload: appointment });
  };

  const deleteAppointment = (appointmentId) => {
    dispatch({ type: ACTIONS.DELETE_APPOINTMENT, payload: appointmentId });
  };

  const forceSave = () => {
    savePendingChanges();
  };

  const value = {
    ...state,
    removeFromQueue,
    addToQueue,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    forceSave
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

// Custom hook
export const useAppointment = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointment must be used within an AppointmentProvider');
  }
  return context;
};
