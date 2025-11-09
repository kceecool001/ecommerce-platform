import React, { useState } from 'react';
import axios from 'axios';

function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    await axios.post('http://localhost:3002/register', { username, password });
    alert('Registered!');
  };

  const login = async () => {
    const res = await axios.post('http://localhost:3002/login', { username, password });
    alert(`Logged in! Token: ${res.data.token}`);
  };

  return (
    <div>
      <h2>Auth</h2>
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
    </div>
  );
}

function App() {
  return (
    <div>
      <h1>Welcome to the Ecommerce Platform</h1>
      <AuthForm />
    </div>
  );
}

export default App;


