import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuthSuccess = (user) => {
    onAuthSuccess(user);
  };

  const switchToSignup = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <>
      {isLogin ? (
        <Login
          onSuccess={handleAuthSuccess}
          onSwitchToSignup={switchToSignup}
        />
      ) : (
        <Signup
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </>
  );
};

export default AuthPage;
