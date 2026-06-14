import { NavigationContainer } from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import { StyleSheet, Text, View } from 'react-native';

import WardrobeScreen from './screens/WardrobeScreen'
import AddItemScreen from './screens/AddItemScreen'
import OutfitScreen from './screens/OutfitScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name = "Wardrobe" component = {WardrobeScreen}/>
        <Tab.Screen name = "Add Item" component = {AddItemScreen} />
        <Tab.Screen name = "Outfit" component = {OutfitScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8fc3cf',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
