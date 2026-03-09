import { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true); // add loading state

    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (err) {
                    // Corrupted data in localStorage — clear it
                    console.error('Failed to parse stored user:', err);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
        }
        setIsLoading(false);
    }, [token]);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);