import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Initial state
const initialState = {
  // User state
  user: null,
  isAuthenticated: false,
  
  // Location state
  currentLocation: null,
  locationPermission: null,
  
  // App state
  isLoading: false,
  error: null,
  
  // Potholes state
  potholes: [],
  selectedPothole: null,
  filters: {
    status: null,
    roadType: null,
    severity: null,
    sortBy: 'priority',
    sortOrder: 'asc',
  },
  
  // UI state
  activeTab: 'map',
  isOnline: true,
  theme: 'light',
  
  // Upload state
  uploadProgress: 0,
  isUploading: false,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // User actions
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  
  // Location actions
  SET_LOCATION: 'SET_LOCATION',
  SET_LOCATION_PERMISSION: 'SET_LOCATION_PERMISSION',
  
  // Potholes actions
  SET_POTHOLES: 'SET_POTHOLES',
  ADD_POTHOLE: 'ADD_POTHOLE',
  UPDATE_POTHOLE: 'UPDATE_POTHOLE',
  SET_SELECTED_POTHOLE: 'SET_SELECTED_POTHOLE',
  SET_FILTERS: 'SET_FILTERS',
  
  // UI actions
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_THEME: 'SET_THEME',
  
  // Upload actions
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  SET_UPLOADING: 'SET_UPLOADING',
};

// Reducer function
const globalReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_USER:
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload 
      };
    
    case ActionTypes.LOGOUT:
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false 
      };
    
    case ActionTypes.SET_LOCATION:
      return { ...state, currentLocation: action.payload };
    
    case ActionTypes.SET_LOCATION_PERMISSION:
      return { ...state, locationPermission: action.payload };
    
    case ActionTypes.SET_POTHOLES:
      return { ...state, potholes: action.payload };
    
    case ActionTypes.ADD_POTHOLE:
      return { 
        ...state, 
        potholes: [action.payload, ...state.potholes] 
      };
    
    case ActionTypes.UPDATE_POTHOLE:
      return {
        ...state,
        potholes: state.potholes.map(pothole =>
          pothole._id === action.payload._id ? action.payload : pothole
        ),
        selectedPothole: state.selectedPothole?._id === action.payload._id 
          ? action.payload 
          : state.selectedPothole
      };
    
    case ActionTypes.SET_SELECTED_POTHOLE:
      return { ...state, selectedPothole: action.payload };
    
    case ActionTypes.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload } 
      };
    
    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    case ActionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    
    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    
    case ActionTypes.SET_UPLOAD_PROGRESS:
      return { ...state, uploadProgress: action.payload };
    
    case ActionTypes.SET_UPLOADING:
      return { ...state, isUploading: action.payload };
    
    default:
      return state;
  }
};

// Create contexts
const GlobalStateContext = createContext();
const GlobalDispatchContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Check for stored user data
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        dispatch({ type: ActionTypes.SET_USER, payload: JSON.parse(userData) });
      }

      // Check location permission
      const locationPermission = await Location.getForegroundPermissionsAsync();
      dispatch({ 
        type: ActionTypes.SET_LOCATION_PERMISSION, 
        payload: locationPermission.status 
      });

      // Get current location if permission granted
      if (locationPermission.status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        dispatch({ 
          type: ActionTypes.SET_LOCATION, 
          payload: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        });
      }

      // Load saved theme
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        dispatch({ type: ActionTypes.SET_THEME, payload: savedTheme });
      }

    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: 'Failed to initialize app' 
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  return (
    <GlobalStateContext.Provider value={state}>
      <GlobalDispatchContext.Provider value={dispatch}>
        {children}
      </GlobalDispatchContext.Provider>
    </GlobalStateContext.Provider>
  );
};

// Custom hooks
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalProvider');
  }
  return context;
};

export const useGlobalDispatch = () => {
  const context = useContext(GlobalDispatchContext);
  if (context === undefined) {
    throw new Error('useGlobalDispatch must be used within a GlobalProvider');
  }
  return context;
};

// Action creators
export const actions = {
  setLoading: (isLoading) => ({
    type: ActionTypes.SET_LOADING,
    payload: isLoading,
  }),

  setError: (error) => ({
    type: ActionTypes.SET_ERROR,
    payload: error,
  }),

  clearError: () => ({
    type: ActionTypes.CLEAR_ERROR,
  }),

  setUser: (user) => ({
    type: ActionTypes.SET_USER,
    payload: user,
  }),

  logout: () => ({
    type: ActionTypes.LOGOUT,
  }),

  setLocation: (location) => ({
    type: ActionTypes.SET_LOCATION,
    payload: location,
  }),

  setLocationPermission: (permission) => ({
    type: ActionTypes.SET_LOCATION_PERMISSION,
    payload: permission,
  }),

  setPotholes: (potholes) => ({
    type: ActionTypes.SET_POTHOLES,
    payload: potholes,
  }),

  addPothole: (pothole) => ({
    type: ActionTypes.ADD_POTHOLE,
    payload: pothole,
  }),

  updatePothole: (pothole) => ({
    type: ActionTypes.UPDATE_POTHOLE,
    payload: pothole,
  }),

  setSelectedPothole: (pothole) => ({
    type: ActionTypes.SET_SELECTED_POTHOLE,
    payload: pothole,
  }),

  setFilters: (filters) => ({
    type: ActionTypes.SET_FILTERS,
    payload: filters,
  }),

  setActiveTab: (tab) => ({
    type: ActionTypes.SET_ACTIVE_TAB,
    payload: tab,
  }),

  setOnlineStatus: (isOnline) => ({
    type: ActionTypes.SET_ONLINE_STATUS,
    payload: isOnline,
  }),

  setTheme: (theme) => ({
    type: ActionTypes.SET_THEME,
    payload: theme,
  }),

  setUploadProgress: (progress) => ({
    type: ActionTypes.SET_UPLOAD_PROGRESS,
    payload: progress,
  }),

  setUploading: (isUploading) => ({
    type: ActionTypes.SET_UPLOADING,
    payload: isUploading,
  }),
};

// Convenience hook for common actions
export const useGlobalActions = () => {
  const dispatch = useGlobalDispatch();

  return {
    setLoading: (isLoading) => dispatch(actions.setLoading(isLoading)),
    setError: (error) => dispatch(actions.setError(error)),
    clearError: () => dispatch(actions.clearError()),
    setUser: (user) => dispatch(actions.setUser(user)),
    logout: () => dispatch(actions.logout()),
    setLocation: (location) => dispatch(actions.setLocation(location)),
    setPotholes: (potholes) => dispatch(actions.setPotholes(potholes)),
    addPothole: (pothole) => dispatch(actions.addPothole(pothole)),
    updatePothole: (pothole) => dispatch(actions.updatePothole(pothole)),
    setSelectedPothole: (pothole) => dispatch(actions.setSelectedPothole(pothole)),
    setFilters: (filters) => dispatch(actions.setFilters(filters)),
    setActiveTab: (tab) => dispatch(actions.setActiveTab(tab)),
    setUploadProgress: (progress) => dispatch(actions.setUploadProgress(progress)),
    setUploading: (isUploading) => dispatch(actions.setUploading(isUploading)),
  };
};