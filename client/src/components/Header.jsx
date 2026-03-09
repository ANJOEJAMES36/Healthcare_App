import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const getStatusConfig = (status) => {
    switch (status) {
        case 'Live':
            return { bg: 'rgba(6, 255, 165, 0.1)', border: 'var(--success)', color: 'var(--success)', dot: '🟢', label: 'Live' };
        case 'Connected':
            return { bg: 'rgba(255, 210, 63, 0.1)', border: 'var(--warning)', color: 'var(--warning)', dot: '🟡', label: 'Connected' };
        case 'Reconnecting...':
            return { bg: 'rgba(255, 210, 63, 0.1)', border: 'var(--warning)', color: 'var(--warning)', dot: '🟡', label: 'Reconnecting...' };
        default:
            return { bg: 'rgba(230, 57, 70, 0.1)', border: 'var(--danger)', color: 'var(--danger)', dot: '🔴', label: 'Offline' };
    }
};

const Header = ({ userName, connectionStatus, onBack }) => {
    const { logout } = useAuth();
    const s = getStatusConfig(connectionStatus);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '20px 32px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '2em',
                        background: 'linear-gradient(90deg, #06ffa5, #4361ee)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Health Monitor Dashboard
                    </h1>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '1.1em' }}>
                        👤 {userName}
                    </p>
                </div>

                {onBack ? (
                    <button
                        onClick={onBack}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(67, 97, 238, 0.1)',
                            border: '1px solid var(--accent-bp)',
                            color: 'var(--accent-bp)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-bp)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(67, 97, 238, 0.1)';
                            e.currentTarget.style.color = 'var(--accent-bp)';
                        }}
                    >
                        ← Go Back
                    </button>
                ) : (
                    <button
                        onClick={logout}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(230, 57, 70, 0.1)',
                            border: '1px solid var(--danger)',
                            color: 'var(--danger)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--danger)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(230, 57, 70, 0.1)';
                            e.currentTarget.style.color = 'var(--danger)';
                        }}
                    >
                        Logout
                    </button>
                )}
            </div>

            {/* Status indicator — 3 states: Live, Connected, Offline */}
            <div style={{
                padding: '12px 24px',
                borderRadius: '24px',
                background: s.bg,
                border: `2px solid ${s.border}`,
                fontWeight: 'bold',
                fontSize: '1em',
                color: s.color
            }}>
                {s.dot} {s.label}
            </div>
        </div>
    );
};

Header.propTypes = {
    userName: PropTypes.string.isRequired,
    connectionStatus: PropTypes.string.isRequired,
    onBack: PropTypes.func
};

export default Header;