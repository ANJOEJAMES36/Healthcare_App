import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { logoutUser } from '../services/AuthService';

const DoctorDashboard = ({ route, navigation }) => {
    const { user } = route.params;

    const patients = [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' }
    ];

    const handleLogout = async () => {
        await logoutUser(); // clear AsyncStorage
        navigation.replace('Login');
    };

    const handlePatientSelect = (patientId, patientName) => {
        // Pass both id and name to BystanderDashboard
        navigation.navigate('BystanderDashboard', {
            userId: patientId,
            userName: patientName
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>{user.name || 'Dr. Smith'}</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Select Patient to Monitor</Text>

            <FlatList
                data={patients}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.patientCard}
                        onPress={() => handlePatientSelect(item.id, item.name)}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👤</Text>
                        </View>
                        <View>
                            <Text style={styles.patientName}>{item.name}</Text>
                            <Text style={styles.patientId}>ID: {item.id}</Text>
                        </View>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutText: {
        color: '#ff4757',
        fontSize: 16,
    },
    sectionTitle: {
        color: '#aaa',
        fontSize: 16,
        marginBottom: 20,
    },
    listContainer: {
        gap: 20,
    },
    patientCard: {
        backgroundColor: '#1a1a2e',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4361ee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
    },
    patientName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    patientId: {
        color: '#aaa',
        fontSize: 14,
    },
    arrow: {
        marginLeft: 'auto',
        color: '#06ffa5',
        fontSize: 24,
        fontWeight: 'bold',
    }
});

export default DoctorDashboard;