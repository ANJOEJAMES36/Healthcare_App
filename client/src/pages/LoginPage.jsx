import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/config';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // add loading state
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.user, data.token);

            if (data.user.role === 'doctor') {
                navigate('/doctor');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '40px',
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
            }}>
                <h2 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    background: 'linear-gradient(90deg, #06ffa5, #4361ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '2em'
                }}>
                    Welcome Back
                </h2>

                {error && (
                    <div style={{
                        background: 'rgba(230, 57, 70, 0.2)',
                        color: '#ff6b6b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Username / ID
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: 'white',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Enter your ID"
                        />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: 'white',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Enter password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isLoading
                                ? 'rgba(255,255,255,0.1)'
                                : 'linear-gradient(90deg, #4361ee, #06ffa5)',
                            color: 'white',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s'
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;