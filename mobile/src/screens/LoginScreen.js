import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loginUser } from '../services/AuthService';

const LoginScreen = ({ navigation }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!userId || !password) {
            Alert.alert('Error', 'Please enter both User ID and Password');
            return;
        }

        setLoading(true);
        try {
            const data = await loginUser(userId, password);
            console.log('Login success:', data.user);

            // Route based on role — pass full user object
            if (data.user.role === 'doctor') {
                navigation.replace('DoctorDashboard', { user: data.user });
            } else {
                navigation.replace('UserDashboard', { user: data.user });
            }
        } catch (error) {
            Alert.alert(
                'Login Failed',
                typeof error === 'string' ? error : (error.message || 'Network Error. Check connection.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Health Care IoT</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="User ID"
                    placeholderTextColor="#aaa"
                    value={userId}
                    onChangeText={setUserId}
                    autoCapitalize="none"
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
                <Text style={styles.dividerText}>OR</Text>
            </View>

            <TouchableOpacity
                style={[styles.button, styles.scanButton]}
                onPress={() => navigation.navigate('Scanner')}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Scan QR Code (Bystander)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#1a1a2e',
        color: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#4361ee',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#2a2a3e',
        opacity: 0.6,
    },
    scanButton: {
        backgroundColor: '#06ffa5',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerText: {
        color: '#aaa',
    },
});

export default LoginScreen;