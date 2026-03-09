import { useState } from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const { logout } = useAuth(); // get logout from auth context

    const users = [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' }
    ];

    if (selectedUser) {
        return (
            <Dashboard
                viewingUserId={selectedUser.id}
                userName={selectedUser.name}
                onBack={() => setSelectedUser(null)}
            />
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
            padding: '20px'
        }}>
            <Header
                userName="Dr. Smith"
                connectionStatus="Connected"
                onLogout={logout} // pass logout to header
            />

            <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
                <h2 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
                    Select Patient to Monitor
                </h2>

                <div style={{ display: 'grid', gap: '20px' }}>
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            style={{
                                background: 'var(--bg-card)',
                                padding: '30px',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                                e.currentTarget.style.borderColor = 'var(--success)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #4361ee, #06ffa5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5em'
                                }}>
                                    👤
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.4em' }}>{user.name}</h3>
                                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>ID: {user.id}</p>
                                </div>
                            </div>
                            <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                View Dashboard →
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;