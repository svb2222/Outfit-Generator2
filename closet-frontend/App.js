import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 

// Import your screen components
import WardrobeScreen from './screens/WardrobeScreen';
import AddItemScreen from './screens/AddItemScreen';
import OutfitScreen from './screens/OutfitScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Wardrobe') {
                iconName = focused ? 'shirt' : 'shirt-outline';
              } else if (route.name === 'Add Item') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              } else if (route.name === 'Outfit') {
                iconName = focused ? 'sparkles' : 'sparkles-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            
            tabBarActiveTintColor: '#000000',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarShowLabel: true,
            tabBarStyle: styles.tabBar,
          })}
        >
          <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
          <Tab.Screen name="Add Item" component={AddItemScreen} />
          <Tab.Screen name="Outfit" component={OutfitScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Prevents unstyled flashes behind the status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
    elevation: 0,       
    shadowOpacity: 0,  
  },
});