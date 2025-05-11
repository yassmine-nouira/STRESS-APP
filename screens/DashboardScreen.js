import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ route, navigation }) => {
  const [stressData, setStressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    // Load stress data from storage
    const loadData = async () => {
      try {
        const stressDataStr = await AsyncStorage.getItem('stressData');
        const data = stressDataStr ? JSON.parse(stressDataStr) : [];
        
        // If we have a new entry from the route params, make sure it's included
        if (route.params?.newEntry) {
          const exists = data.some(entry => entry.id === route.params.newEntry.id);
          if (!exists) {
            data.push(route.params.newEntry);
            await AsyncStorage.setItem('stressData', JSON.stringify(data));
          }
        }
        
        setStressData(data);
      } catch (error) {
        console.error('Failed to load stress data', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [route.params?.newEntry]);
  
  const prepareChartData = () => {
    // Sort data by date
    const sortedData = [...stressData].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Take only the last 7 entries or fewer if not available
    const recentData = sortedData.slice(-7);
    
    return {
      labels: recentData.map(entry => {
        const date = new Date(entry.timestamp);
        return `${date.getMonth()+1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: recentData.map(entry => entry.stressScore),
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };
  
  const calculateAverageStress = () => {
    if (stressData.length === 0) return 0;
    const sum = stressData.reduce((acc, entry) => acc + entry.stressScore, 0);
    return (sum / stressData.length).toFixed(1);
  };
  
  const getLatestStressScore = () => {
    if (stressData.length === 0) return null;
    
    const latestEntry = stressData.reduce((latest, entry) => {
      return new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest;
    }, stressData[0]);
    
    return latestEntry.stressScore;
  };
  
  const getStressCategory = (score) => {
    if (score === null) return 'No data';
    if (score < 3) return 'Low';
    if (score < 7) return 'Moderate';
    return 'High';
  };
  
  const getStressColor = (score) => {
    if (score === null) return '#888';
    if (score < 3) return '#67B26F';
    if (score < 7) return '#F8D775';
    return '#E74C3C';
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading your stress data...</Text>
      </View>
    );
  }
  
  const latestScore = getLatestStressScore();
  const chartData = prepareChartData();
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.scoreCardContainer}>
        <View style={[styles.scoreCard, { backgroundColor: getStressColor(latestScore) }]}>
          <Text style={styles.scoreLabel}>Your Current Stress Level</Text>
          <Text style={styles.scoreValue}>{latestScore !== null ? latestScore.toFixed(1) : 'N/A'}</Text>
          <Text style={styles.scoreCategory}>{getStressCategory(latestScore)}</Text>
        </View>
        
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Average Stress</Text>
          <Text style={styles.scoreValue}>{calculateAverageStress()}</Text>
          <Text style={styles.scoreCategory}>Last 30 days</Text>
        </View>
      </View>
      
      {stressData.length > 1 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Stress Trend</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#FFF',
              backgroundGradientFrom: '#FFF',
              backgroundGradientTo: '#FFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#4A90E2',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Complete more assessments to see your stress trend over time
          </Text>
        </View>
      )}
      
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>AI Insights</Text>
        {latestScore !== null ? (
          <>
            <Text style={styles.insightText}>
              Based on your responses and sensor data, our AI model has identified the following insights:
            </Text>
            
            {latestScore > 7 && (
              <View style={styles.insight}>
                <Text style={styles.insightTitle}>🚨 High Stress Alert</Text>
                <Text>Your stress levels are significantly elevated. Consider taking breaks and practicing relaxation techniques.</Text>
              </View>
            )}
            
            {latestScore > 5 && (
              <View style={styles.insight}>
                <Text style={styles.insightTitle}>💤 Sleep Focus</Text>
                <Text>Your sleep quality appears to be affecting your stress levels. Try to improve your sleep hygiene.</Text>
              </View>
            )}
            
            {latestScore < 4 && (
              <View style={styles.insight}>
                <Text style={styles.insightTitle}>✅ Good Management</Text>
                <Text>You're managing your stress well! Continue your current practices.</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.assessmentButton}
              onPress={() => navigation.navigate('StressSurvey')}
            >
              <Text style={styles.assessmentButtonText}>Take New Assessment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noDataText}>
            Complete your first assessment to receive personalized insights
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scoreCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreCategory: {
    fontSize: 14,
    color: '#555',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#555',
  },
  insightsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  insightText: {
    marginBottom: 15,
  },
  insight: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  insightTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  assessmentButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  assessmentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DashboardScreen;