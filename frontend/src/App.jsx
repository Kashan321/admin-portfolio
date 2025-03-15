import React, { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import { AuthProvider, auth_context } from './context/AuthContext';

function App() {
  const { authenticated } = useContext(auth_context);

  return (
    <Routes>
      {authenticated ? (
        <Route path='/' element={<Home />} />
      ) : (
        <Route path='/login' element={<Login />} />
      )}
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}