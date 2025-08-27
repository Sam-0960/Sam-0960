import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import MapScreen from '../screens/MapScreen';
import UploadScreen from '../screens/UploadScreen';
import StatusScreen from '../screens/StatusScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PotholeDetailScreen from '../screens/PotholeDetailScreen';

import { colors, typography } from '../utils/theme';
import { useGlobalState } from '../services/GlobalContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for each tab
const MapStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...typography.h6,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen 
        name="MapMain" 
        component={MapScreen} 
        options={{ 
          title: 'Pothole Map',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="PotholeDetail" 
        component={PotholeDetailScreen} 
        options={{ 
          title: 'Pothole Details',
          headerBackTitleVisible: false,
        }} 
      />
    </Stack.Navigator>
  );
};

const UploadStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...typography.h6,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen 
        name="UploadMain" 
        component={UploadScreen} 
        options={{ 
          title: 'Report Pothole',
          headerShown: false 
        }} 
      />
    </Stack.Navigator>
  );
};

const StatusStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...typography.h6,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen 
        name="StatusMain" 
        component={StatusScreen} 
        options={{ 
          title: 'Status Dashboard',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="PotholeDetail" 
        component={PotholeDetailScreen} 
        options={{ 
          title: 'Pothole Details',
          headerBackTitleVisible: false,
        }} 
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...typography.h6,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerShown: false 
        }} 
      />
    </Stack.Navigator>
  );
};

// Custom tab bar icon component
const TabIcon = ({ name, focused, color, size }) => {
  const iconName = focused ? name : name + '-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
};

// Custom tab bar label component
const TabLabel = ({ focused, children }) => {
  return (
    <Text
      style={{
        ...typography.caption,
        color: focused ? colors.primary : colors.textLight,
        fontWeight: focused ? '600' : 'normal',
        marginTop: 2,
      }}
    >
      {children}
    </Text>
  );
};

const AppNavigator = () => {
  const { activeTab } = useGlobalState();

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Map':
              iconName = 'map';
              break;
            case 'Upload':
              iconName = 'camera';
              break;
            case 'Status':
              iconName = 'list';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <TabIcon 
                name={iconName} 
                focused={focused} 
                color={color} 
                size={size} 
              />
            </View>
          );
        },
        tabBarLabel: ({ focused, children }) => (
          <TabLabel focused={focused}>{children}</TabLabel>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.background,
          paddingBottom: 5,
          paddingTop: 5,
          height: 65,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadStack}
        options={{
          tabBarLabel: 'Report',
        }}
      />
      <Tab.Screen 
        name="Status" 
        component={StatusStack}
        options={{
          tabBarLabel: 'Status',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;