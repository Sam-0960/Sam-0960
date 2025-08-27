import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Chip } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';
import { useGlobalState, useGlobalActions } from '../services/GlobalContext';
import { potholeAPI, handleApiError } from '../services/api';

const { width, height } = Dimensions.get('window');

const PotholeDetailScreen = ({ route, navigation }) => {
  const { potholeId } = route.params;
  const { selectedPothole } = useGlobalState();
  const { setSelectedPothole, setError } = useGlobalActions();

  const [pothole, setPothole] = useState(selectedPothole);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pothole || pothole._id !== potholeId) {
      loadPotholeDetails();
    }
  }, [potholeId]);

  const loadPotholeDetails = async () => {
    try {
      setLoading(true);
      const response = await potholeAPI.getPotholeById(potholeId);
      
      if (response.success) {
        setPothole(response.data);
        setSelectedPothole(response.data);
      } else {
        setError('Failed to load pothole details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading pothole details:', error);
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (!pothole) return;

    const lat = pothole.location.coordinates[1];
    const lng = pothole.location.coordinates[0];
    const label = `Pothole on ${pothole.roadType}`;

    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    });
  };

  const shareLocation = () => {
    if (!pothole) return;

    const lat = pothole.location.coordinates[1];
    const lng = pothole.location.coordinates[0];
    const message = `Pothole reported on ${pothole.roadType}\nStatus: ${pothole.status}\nLocation: ${lat}, ${lng}\nReported: ${new Date(pothole.createdAt).toLocaleDateString()}`;

    Share.share({
      message,
      title: 'Pothole Report',
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Not Fixed':
        return { emoji: '🟥', color: colors.notFixed, text: 'Needs Attention' };
      case 'Under Progress':
        return { emoji: '🟨', color: colors.underProgress, text: 'Being Fixed' };
      case 'Fixed':
        return { emoji: '🟩', color: colors.fixed, text: 'Resolved' };
      default:
        return { emoji: '⚪', color: colors.textLight, text: 'Unknown' };
    }
  };

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { text: 'Critical', color: colors.error, icon: 'alert-circle' };
      case 2:
        return { text: 'High', color: colors.warning, icon: 'warning' };
      case 3:
        return { text: 'Medium', color: colors.info, icon: 'information-circle' };
      case 4:
        return { text: 'Low', color: colors.success, icon: 'checkmark-circle' };
      default:
        return { text: 'Unknown', color: colors.textLight, icon: 'help-circle' };
    }
  };

  const getRoadTypeIcon = (roadType) => {
    switch (roadType) {
      case 'Highway':
        return 'car-sport';
      case 'Main Road':
        return 'car';
      case 'Inner Road':
        return 'bicycle';
      case 'Alley':
        return 'walk';
      default:
        return 'road';
    }
  };

  if (!pothole) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pothole details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(pothole.status);
  const priorityInfo = getPriorityInfo(pothole.priority);
  const roadIcon = getRoadTypeIcon(pothole.roadType);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{pothole.roadType}</Text>
            <Text style={styles.headerSubtitle}>
              {statusInfo.emoji} {pothole.status}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={shareLocation}
          >
            <Ionicons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <Animatable.View animation="fadeInUp" delay={100}>
          <Card style={styles.imageCard}>
            {pothole.image?.url ? (
              <Image 
                source={{ uri: pothole.image.url }} 
                style={styles.potholeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image" size={48} color={colors.textLight} />
                <Text style={styles.imagePlaceholderText}>No image available</Text>
              </View>
            )}
          </Card>
        </Animatable.View>

        {/* Status and Priority */}
        <Animatable.View animation="fadeInUp" delay={200}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
                <Text style={styles.statusText}>{pothole.status}</Text>
              </View>
              
              <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}>
                <Ionicons name={priorityInfo.icon} size={16} color="#fff" />
                <Text style={styles.priorityText}>{priorityInfo.text} Priority</Text>
              </View>
            </View>
            
            <Text style={styles.statusDescription}>{statusInfo.text}</Text>
          </Card>
        </Animatable.View>

        {/* Details */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name={roadIcon} size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>Road Type:</Text>
              <Text style={styles.detailValue}>{pothole.roadType}</Text>
            </View>

            {pothole.severity && (
              <View style={styles.detailRow}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={styles.detailLabel}>Severity:</Text>
                <Text style={styles.detailValue}>{pothole.severity}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={colors.info} />
              <Text style={styles.detailLabel}>Reported:</Text>
              <Text style={styles.detailValue}>
                {new Date(pothole.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={colors.info} />
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(pothole.createdAt).toLocaleTimeString()}
              </Text>
            </View>

            {pothole.reportedBy?.username && (
              <View style={styles.detailRow}>
                <Ionicons name="person" size={20} color={colors.secondary} />
                <Text style={styles.detailLabel}>Reported by:</Text>
                <Text style={styles.detailValue}>{pothole.reportedBy.username}</Text>
              </View>
            )}
          </Card>
        </Animatable.View>

        {/* Description */}
        {pothole.description && (
          <Animatable.View animation="fadeInUp" delay={400}>
            <Card style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{pothole.description}</Text>
            </Card>
          </Animatable.View>
        )}

        {/* Location */}
        <Animatable.View animation="fadeInUp" delay={500}>
          <Card style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={openInMaps}
              >
                <Ionicons name="navigate" size={16} color={colors.primary} />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.coordinatesText}>
              📍 {pothole.location.coordinates[1].toFixed(6)}, {pothole.location.coordinates[0].toFixed(6)}
            </Text>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: pothole.location.coordinates[1],
                  longitude: pothole.location.coordinates[0],
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                }}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: pothole.location.coordinates[1],
                    longitude: pothole.location.coordinates[0],
                  }}
                >
                  <View style={[styles.mapMarker, { backgroundColor: statusInfo.color }]}>
                    <Text style={styles.mapMarkerEmoji}>{statusInfo.emoji}</Text>
                  </View>
                </Marker>
              </MapView>
            </View>
          </Card>
        </Animatable.View>

        {/* Status History */}
        {pothole.statusHistory && pothole.statusHistory.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={600}>
            <Card style={styles.historyCard}>
              <Text style={styles.sectionTitle}>Status History</Text>
              
              {pothole.statusHistory.map((history, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyStatus}>{history.status}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(history.updatedAt).toLocaleDateString()} by {history.updatedBy}
                    </Text>
                    {history.notes && (
                      <Text style={styles.historyNotes}>{history.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </Animatable.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <Button
          mode="contained"
          onPress={openInMaps}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          icon="navigate"
        >
          Get Directions
        </Button>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h6,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body2,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
  },
  imageCard: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  potholeImage: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...typography.body2,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  statusCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusEmoji: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.body2,
    color: '#fff',
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  statusDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  detailValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    flex: 2,
  },
  descriptionCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  descriptionText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
  },
  locationCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.sm,
  },
  directionsText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  coordinatesText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 150,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...shadows.sm,
  },
  mapMarkerEmoji: {
    fontSize: 16,
  },
  historyCard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  historyDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  historyNotes: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  actionButtonContent: {
    paddingVertical: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default PotholeDetailScreen;