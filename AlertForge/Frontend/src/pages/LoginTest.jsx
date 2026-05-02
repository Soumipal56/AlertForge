import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/testApi';

const LoginTest = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/login', { email, password });
            navigate('/test-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Login (Custom Auth)</h1>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email: </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password: </label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>Don't have an account? <a href="/test-register">Register here</a></p>
        </div>
    );
};

export default LoginTest;
