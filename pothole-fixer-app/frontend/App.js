import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DropdownAlert from 'react-native-dropdownalert';

import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';
import { GlobalProvider } from './src/services/GlobalContext';

export default function App() {
  let dropDownAlertRef = null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <GlobalProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="auto" />
            <AppNavigator />
            <DropdownAlert
              ref={(ref) => (dropDownAlertRef = ref)}
              closeInterval={4000}
              imageSrc={null}
              zIndex={5000}
              elevation={1000}
            />
          </NavigationContainer>
        </GlobalProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}