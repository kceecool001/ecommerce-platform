import React, { useState } from 'react';
import AuthForm from './AuthForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  return (
    <div>
      <h1>Welcome to the E-Commerce Platform</h1>
      {!token ? (
        <AuthForm onLogin={setToken} />
      ) : (
        <div>
          <p>Logged in! Token stored.</p>
          <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
