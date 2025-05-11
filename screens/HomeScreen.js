import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to StressLess</Text>
      <Text style={styles.subtitle}>Monitor and manage your stress levels with AI assistance</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('StressSurvey')}
      >
        <Text style={styles.buttonText}>Take Stress Assessment</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.buttonText}>View Your Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#67B26F',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;