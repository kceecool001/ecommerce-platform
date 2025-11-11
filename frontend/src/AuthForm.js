import React, { useState } from 'react';
import axios from 'axios';

function AuthForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      await axios.post('http://localhost:3002/register', { username, password });
      alert('Registered successfully!');
    } catch (err) {
      alert(err.response?.data || 'Registration failed');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:3002/login', { username, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      alert('Logged in successfully!');
      onLogin(token);
    } catch (err) {
      alert(err.response?.data || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Authentication</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div>
        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
      </div>
    </div>
  );
}

export default AuthForm;
