import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const api = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || 'https://restaurant-api.onrender.com') + '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 