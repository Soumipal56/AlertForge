import React, { useState } from 'react';
import api from '../api/testApi';

const RegisterTest = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setResult(null);
        setError('');
        try {
            const response = await api.post('/auth/register', { email, password });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Register (Custom Auth)</h1>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Email: </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password: </label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Register</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {result && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid green' }}>
                    <p style={{ color: 'green' }}>Registration Successful!</p>
                    <p><strong>API Key:</strong> {result.apiKey}</p>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
            <p><a href="/test-login">Go to Login</a></p>
        </div>
    );
};

export default RegisterTest;
