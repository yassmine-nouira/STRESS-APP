import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen.js';
import StressSurveyScreen from './screens/StressSurveyScreen.js';
import DashboardScreen from './screens/DashboardScreen.js';
import StressAIModel from './utils/StressAIModel.js';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Stress Monitor' }} />
          <Stack.Screen name="StressSurvey" component={StressSurveyScreen} options={{ title: 'Stress Assessment' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Your Stress Insights' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});