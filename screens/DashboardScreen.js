import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ route, navigation }) => {
  const [stressData, setStressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
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
        
        // Generate insights based on the data
        if (data.length > 0) {
          generateInsights(data);
        }
      } catch (error) {
        console.error('Failed to load stress data', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [route.params?.newEntry]);
  
  const generateInsights = (data) => {
    const generatedInsights = [];
    
    // Get the latest entry
    const latestEntry = [...data].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    
    const latestScore = latestEntry.stressScore;
    
    // Get entries from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentEntries = data.filter(entry => 
      new Date(entry.timestamp) >= oneWeekAgo
    );
    
    // Calculate average stress for the past week
    let weeklyAvg = 0;
    if (recentEntries.length > 0) {
      weeklyAvg = recentEntries.reduce((sum, entry) => sum + entry.stressScore, 0) / recentEntries.length;
    }
    
    // Check if there's a trend
    let stressTrend = null;
    if (recentEntries.length >= 3) {
      const sortedEntries = [...recentEntries].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      const firstHalf = sortedEntries.slice(0, Math.floor(sortedEntries.length / 2));
      const secondHalf = sortedEntries.slice(Math.floor(sortedEntries.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.stressScore, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.stressScore, 0) / secondHalf.length;
      
      if (secondHalfAvg - firstHalfAvg > 1) {
        stressTrend = 'increasing';
      } else if (firstHalfAvg - secondHalfAvg > 1) {
        stressTrend = 'decreasing';
      } else {
        stressTrend = 'stable';
      }
    }
    
    // Generate insights based on the current stress level
    if (latestScore > 7) {
      generatedInsights.push({
        id: 'high-stress',
        title: '🚨 High Stress Alert',
        text: 'Your stress levels are significantly elevated. Consider taking breaks and practicing deep breathing or meditation.'
      });
    } else if (latestScore < 3) {
      generatedInsights.push({
        id: 'low-stress',
        title: '✅ Great Job!',
        text: 'Your stress levels are low. Keep up the good work with your stress management techniques!'
      });
    } else {
      generatedInsights.push({
        id: 'moderate-stress',
        title: '⚠️ Moderate Stress',
        text: 'Your stress is at a moderate level. Try to incorporate more relaxation activities in your daily routine.'
      });
    }
    
    // Check sleep quality from latest survey
    if (latestEntry.surveyResponses && latestEntry.surveyResponses[3] < 4) {
      generatedInsights.push({
        id: 'poor-sleep',
        title: '💤 Sleep Focus Needed',
        text: 'Your sleep quality appears to be affecting your stress levels. Try establishing a regular sleep schedule and avoiding screens before bedtime.'
      });
    }
    
    // Check focus difficulty from latest survey
    if (latestEntry.surveyResponses && latestEntry.surveyResponses[5] > 7) {
      generatedInsights.push({
        id: 'focus-issues',
        title: '🎯 Concentration Challenges',
        text: 'You\'re having difficulty focusing. Try breaking tasks into smaller chunks and taking short breaks between focused work sessions.'
      });
    }
    
    // Check heart rate from sensor data
    if (latestEntry.sensorData && latestEntry.sensorData.heartRate > 85) {
      generatedInsights.push({
        id: 'elevated-heart-rate',
        title: '❤️ Elevated Heart Rate',
        text: 'Your heart rate is higher than usual. Consider incorporating more physical activity or relaxation techniques to help regulate it.'
      });
    }
    
    // Add trend insights
    if (stressTrend === 'increasing' && recentEntries.length >= 3) {
      generatedInsights.push({
        id: 'increasing-trend',
        title: '📈 Increasing Stress Trend',
        text: 'Your stress levels have been rising over the past week. Try to identify any new stressors in your life and address them early.'
      });
    } else if (stressTrend === 'decreasing' && recentEntries.length >= 3) {
      generatedInsights.push({
        id: 'decreasing-trend',
        title: '📉 Improving Stress Trend',
        text: 'Great news! Your stress levels have been decreasing over the past week. Keep up with the positive changes you\'ve made.'
      });
    }
    
    // If we have enough data points, compare to overall average
    if (data.length >= 5) {
      const overallAvg = data.reduce((sum, entry) => sum + entry.stressScore, 0) / data.length;
      
      if (latestScore > overallAvg + 2) {
        generatedInsights.push({
          id: 'above-average',
          title: '⚠️ Above Your Average',
          text: `Your current stress score (${latestScore.toFixed(1)}) is significantly higher than your overall average (${overallAvg.toFixed(1)}). This might be a good time to use your proven stress reduction techniques.`
        });
      } else if (latestScore < overallAvg - 2) {
        generatedInsights.push({
          id: 'below-average',
          title: '🌟 Below Your Average',
          text: `Your current stress score (${latestScore.toFixed(1)}) is significantly lower than your overall average (${overallAvg.toFixed(1)}). Whatever you're doing is working well!`
        });
      }
    }
    
    // Limit to max 3 insights to avoid overwhelming the user
    setInsights(generatedInsights.slice(0, 3));
  };
  
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
        {latestScore !== null && insights.length > 0 ? (
          <>
            <Text style={styles.insightText}>
              Based on your responses and sensor data, our AI model has identified the following insights:
            </Text>
            
            {insights.map(insight => (
              <View key={insight.id} style={styles.insight}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text>{insight.text}</Text>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.assessmentButton}
              onPress={() => navigation.navigate('StressSurvey')}
            >
              <Text style={styles.assessmentButtonText}>Take New Assessment</Text>
            </TouchableOpacity>
          </>
        ) : latestScore !== null ? (
          <>
            <Text style={styles.insightText}>
              Our AI is analyzing your data. Complete more assessments for personalized insights.
            </Text>
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
    padding:15,
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