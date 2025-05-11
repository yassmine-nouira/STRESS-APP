import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import  Slider  from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StressAIModel from '../utils/StressAIModel.js';

const stressQuestions = [
  { 
    id: 1, 
    question: 'How would you rate your current stress level?', 
    type: 'slider', 
    min: 0, 
    max: 10, 
    defaultValue: 5 
  },
  { 
    id: 2, 
    question: 'How difficult is it for you to relax today?', 
    type: 'slider', 
    min: 0, 
    max: 10, 
    defaultValue: 5 
  },
  { 
    id: 3, 
    question: 'How well did you sleep last night?', 
    type: 'slider', 
    min: 0, 
    max: 10, 
    defaultValue: 5 
  },
  { 
    id: 4, 
    question: 'How irritable do you feel today?', 
    type: 'slider', 
    min: 0, 
    max: 10, 
    defaultValue: 5 
  },
  { 
    id: 5, 
    question: 'How difficult is it to focus on tasks today?', 
    type: 'slider', 
    min: 0, 
    max: 10, 
    defaultValue: 5 
  },
];

const StressSurveyScreen = ({ navigation }) => {
  const [responses, setResponses] = useState({});
  const [heartRate, setHeartRate] = useState(75); // Simulated heart rate
  const [stepCount, setStepCount] = useState(4200); // Simulated step count
  
  // Initialize responses
  useEffect(() => {
    const initialResponses = {};
    stressQuestions.forEach(q => {
      initialResponses[q.id] = q.defaultValue;
    });
    setResponses(initialResponses);
    
    // Simulate sensor data
    const heartRateInterval = setInterval(() => {
      setHeartRate(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    
    return () => clearInterval(heartRateInterval);
  }, []);
  
  const handleSliderChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const collectSensorData = () => {
    // In a real app, you would collect data from device sensors
    // This is a simplified example
    return {
      heartRate,
      stepCount,
      timestamp: new Date().toISOString(),
    };
  };
  
  const handleSubmit = async () => {
    try {
      // Collect all stress-related data
      const sensorData = collectSensorData();
      const submissionData = {
        surveyResponses: responses,
        sensorData,
        timestamp: new Date().toISOString(),
      };
      
      // Process through AI model
      const stressAI = new StressAIModel();
      const stressScore = await stressAI.predictStressLevel(submissionData);
      
      // Store results
      const existingDataStr = await AsyncStorage.getItem('stressData');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      const newStressEntry = {
        ...submissionData,
        stressScore,
        id: Date.now().toString(),
      };
      
      await AsyncStorage.setItem('stressData', JSON.stringify([...existingData, newStressEntry]));
      
      // Navigate to dashboard with results
      navigation.navigate('Dashboard', { newEntry: newStressEntry });
    } catch (error) {
      Alert.alert('Error', 'Failed to process stress assessment');
      console.error(error);
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Stress Assessment</Text>
      <Text style={styles.subtitle}>Please answer the following questions honestly to get accurate insights</Text>
      
      {stressQuestions.map(question => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.question}>{question.question}</Text>
          <Slider
            style={styles.slider}
            minimumValue={question.min}
            maximumValue={question.max}
            step={1}
            value={responses[question.id] || question.defaultValue}
            onValueChange={(value) => handleSliderChange(question.id, value)}
            minimumTrackTintColor="#4A90E2"
            maximumTrackTintColor="#D3D3D3"
            thumbTintColor="#4A90E2"
          />
          <View style={styles.sliderLabels}>
            <Text>
              {question.min === 0 ? 'Not at all' : question.min}
            </Text>
            <Text>
              {question.max === 10 ? 'Extremely' : question.max}
            </Text>
          </View>
        </View>
      ))}
      
      <View style={styles.sensorDataContainer}>
        <Text style={styles.sensorTitle}>Collected Sensor Data</Text>
        <Text style={styles.sensorText}>Heart Rate: {heartRate} BPM</Text>
        <Text style={styles.sensorText}>Step Count Today: {stepCount}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Submit Assessment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  questionContainer: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sensorDataContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  sensorTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sensorText: {
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#67B26F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StressSurveyScreen;
