import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FAB, Chip, Card, Button } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';
import { useGlobalState, useGlobalActions } from '../services/GlobalContext';
import { potholeAPI, handleApiError } from '../services/api';

const { width, height } = Dimensions.get('window');

// Custom marker colors based on status
const getMarkerColor = (status) => {
  switch (status) {
    case 'Not Fixed':
      return colors.notFixed;
    case 'Under Progress':
      return colors.underProgress;
    case 'Fixed':
      return colors.fixed;
    default:
      return colors.textLight;
  }
};

// Get status emoji
const getStatusEmoji = (status) => {
  switch (status) {
    case 'Not Fixed':
      return '🟥';
    case 'Under Progress':
      return '🟨';
    case 'Fixed':
      return '🟩';
    default:
      return '⚪';
  }
};

// Custom marker component
const CustomMarker = ({ pothole, onPress }) => {
  const markerColor = getMarkerColor(pothole.status);
  
  return (
    <Marker
      coordinate={{
        latitude: pothole.location.coordinates[1],
        longitude: pothole.location.coordinates[0],
      }}
      onPress={() => onPress(pothole)}
      tracksViewChanges={false}
    >
      <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
        <Text style={styles.markerEmoji}>{getStatusEmoji(pothole.status)}</Text>
      </View>
      
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{pothole.roadType}</Text>
          <Text style={styles.calloutStatus}>
            {getStatusEmoji(pothole.status)} {pothole.status}
          </Text>
          <Text style={styles.calloutDate}>
            {new Date(pothole.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const MapScreen = ({ navigation }) => {
  const { 
    currentLocation, 
    potholes, 
    filters, 
    isLoading 
  } = useGlobalState();
  
  const { 
    setPotholes, 
    setSelectedPothole, 
    setLocation, 
    setError,
    setLoading 
  } = useGlobalActions();

  const [mapRegion, setMapRegion] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Initialize map region
  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // Default to a general location if no current location
      setMapRegion({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  }, [currentLocation]);

  // Load potholes on component mount
  useEffect(() => {
    loadPotholes();
  }, []);

  // Reload potholes when filters change
  useEffect(() => {
    if (mapReady) {
      loadPotholes();
    }
  }, [filters, mapReady]);

  const loadPotholes = async () => {
    try {
      setLoading(true);
      
      const params = {
        ...filters,
        ...(currentLocation && {
          longitude: currentLocation.longitude,
          latitude: currentLocation.latitude,
          radius: 50000, // 50km radius
        }),
        limit: 200, // Limit for performance
      };

      const response = await potholeAPI.getPotholes(params);
      
      if (response.success) {
        setPotholes(response.data || []);
      } else {
        setError('Failed to load potholes');
      }
    } catch (error) {
      console.error('Error loading potholes:', error);
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your current location.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setLocation(newLocation);
      
      // Animate to new location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const onMarkerPress = async (pothole) => {
    setSelectedPothole(pothole);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Navigate to detail screen
    navigation.navigate('PotholeDetail', { potholeId: pothole._id });
  };

  const onMapPress = () => {
    setSelectedPothole(null);
  };

  const filterByStatus = (status) => {
    setSelectedStatus(selectedStatus === status ? null : status);
    // Update global filters - this will trigger reload via useEffect
    // setFilters({ status: selectedStatus === status ? null : status });
  };

  const getFilteredPotholes = () => {
    if (!selectedStatus) return potholes;
    return potholes.filter(pothole => pothole.status === selectedStatus);
  };

  const zoomToFitPotholes = () => {
    const filteredPotholes = getFilteredPotholes();
    
    if (filteredPotholes.length === 0) return;

    const coordinates = filteredPotholes.map(pothole => ({
      latitude: pothole.location.coordinates[1],
      longitude: pothole.location.coordinates[0],
    }));

    if (mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const statusFilters = [
    { status: 'Not Fixed', emoji: '🟥', count: potholes.filter(p => p.status === 'Not Fixed').length },
    { status: 'Under Progress', emoji: '🟨', count: potholes.filter(p => p.status === 'Under Progress').length },
    { status: 'Fixed', emoji: '🟩', count: potholes.filter(p => p.status === 'Fixed').length },
  ];

  if (!mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Pothole Map</Text>
            <Text style={styles.headerSubtitle}>
              {getFilteredPotholes().length} potholes found
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name={showFilters ? "close" : "options"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Filter Chips */}
        {showFilters && (
          <Animatable.View 
            animation="fadeInDown" 
            style={styles.filtersContainer}
          >
            {statusFilters.map((filter) => (
              <Chip
                key={filter.status}
                selected={selectedStatus === filter.status}
                onPress={() => filterByStatus(filter.status)}
                style={[
                  styles.filterChip,
                  selectedStatus === filter.status && styles.filterChipSelected
                ]}
                textStyle={styles.filterChipText}
              >
                {filter.emoji} {filter.status} ({filter.count})
              </Chip>
            ))}
          </Animatable.View>
        )}
      </LinearGradient>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={onMapPress}
          onMapReady={() => setMapReady(true)}
          loadingEnabled={true}
          loadingBackgroundColor={colors.background}
          loadingIndicatorColor={colors.primary}
        >
          {getFilteredPotholes().map((pothole) => (
            <CustomMarker
              key={pothole._id}
              pothole={pothole}
              onPress={onMarkerPress}
            />
          ))}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={getCurrentLocation}
            disabled={isLoading}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Zoom to Fit Button */}
          {getFilteredPotholes().length > 0 && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={zoomToFitPotholes}
            >
              <Ionicons name="scan" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Legend */}
        <Card style={styles.legend}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <Text style={styles.legendEmoji}>🟥</Text>
              <Text style={styles.legendText}>Not Fixed</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendEmoji}>🟨</Text>
              <Text style={styles.legendText}>In Progress</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendEmoji}>🟩</Text>
              <Text style={styles.legendText}>Fixed</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Report"
        onPress={() => navigation.navigate('Upload')}
      />

      {/* Refresh Button */}
      <FAB
        style={styles.refreshFab}
        icon="refresh"
        small
        onPress={loadPotholes}
        loading={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h5,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body2,
    color: '#fff',
    opacity: 0.9,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: '#fff',
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    gap: spacing.sm,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  legend: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  legendTitle: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legendItems: {
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...shadows.sm,
  },
  markerEmoji: {
    fontSize: 16,
  },
  calloutContainer: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
    minWidth: 120,
  },
  calloutTitle: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text,
  },
  calloutStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  calloutDate: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 10,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
  },
  refreshFab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl * 2.5,
    backgroundColor: colors.secondary,
  },
});

export default MapScreen;