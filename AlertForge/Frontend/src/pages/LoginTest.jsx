import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import api from '../api/testApi';

const LoginTest = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Check for error from Google OAuth callback
    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
        }
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/api/auth/login', { email, password });
            navigate('/test-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    // Handle Google OAuth login
    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth endpoint
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`;
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center' }}>Login</h1>
            
            {/* Google Login Button */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <button 
                    onClick={handleGoogleLogin}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#4285F4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#357ae8'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4285F4'}
                >
                    {/* Google SVG Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>
            </div>

            {/* Divider */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '20px 0',
                color: '#666'
            }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
                <span style={{ padding: '0 10px', fontSize: '14px' }}>or</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
            </div>

            {/* Email/Password Login Form */}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email: </label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password: </label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <button 
                    type="submit" 
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                    }}
                >
                    Login
                </button>
            </form>
            
            {error && (
                <p style={{ 
                    color: 'red', 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#ffe6e6', 
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    {error}
                </p>
            )}
            
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Don't have an account? <a href="/test-register">Register here</a>
            </p>
        </div>
    );
};

export default LoginTest;
