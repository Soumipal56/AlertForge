import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../api/testApi';

const DashboardTest = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchIncidents = async () => {
        try {
            const response = await api.get('/api/incidents');
            setIncidents(response.data.data || []);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 401) {
                console.log("Access token expired, attempting refresh...");
                try {
                    await api.post('/api/auth/refresh');
                    // Retry original request
                    const retryResponse = await api.get('/api/incidents');
                    setIncidents(retryResponse.data.data || []);
                    setLoading(false);
                } catch (refreshErr) {
                    console.error("Refresh failed", refreshErr);
                    navigate('/test-login');
                }
            } else {
                setError(err.response?.data?.message || 'Failed to fetch incidents');
                setLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
            navigate('/test-login');
        } catch (err) {
            console.error("Logout failed", err);
            navigate('/test-login');
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    if (loading) return <p>Loading dashboard...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Test Dashboard (Protected)</h1>
                <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}>Logout</button>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Incidents</h2>
            {incidents.length === 0 ? (
                <p>No incidents found.</p>
            ) : (
                <ul>
                    {incidents.map((incident) => (
                        <li key={incident._id}>
                            <strong>{incident.message}</strong> - {incident.status} ({incident.severity})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DashboardTest;
