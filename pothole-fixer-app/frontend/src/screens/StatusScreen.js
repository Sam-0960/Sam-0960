import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Chip, Searchbar, FAB } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';
import { useGlobalState, useGlobalActions } from '../services/GlobalContext';
import { potholeAPI, handleApiError } from '../services/api';

const { width } = Dimensions.get('window');

// Priority indicators
const getPriorityInfo = (priority) => {
  switch (priority) {
    case 1:
      return { text: 'Critical', color: colors.error, icon: 'alert' };
    case 2:
      return { text: 'High', color: colors.warning, icon: 'warning' };
    case 3:
      return { text: 'Medium', color: colors.info, icon: 'information' };
    case 4:
      return { text: 'Low', color: colors.success, icon: 'checkmark' };
    default:
      return { text: 'Unknown', color: colors.textLight, icon: 'help' };
  }
};

// Status colors and emojis
const getStatusInfo = (status) => {
  switch (status) {
    case 'Not Fixed':
      return { emoji: '🟥', color: colors.notFixed };
    case 'Under Progress':
      return { emoji: '🟨', color: colors.underProgress };
    case 'Fixed':
      return { emoji: '🟩', color: colors.fixed };
    default:
      return { emoji: '⚪', color: colors.textLight };
  }
};

// Road type icons
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

// Pothole item component
const PotholeItem = ({ pothole, onPress, index }) => {
  const statusInfo = getStatusInfo(pothole.status);
  const priorityInfo = getPriorityInfo(pothole.priority);
  const roadIcon = getRoadTypeIcon(pothole.roadType);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      style={styles.itemContainer}
    >
      <TouchableOpacity onPress={() => onPress(pothole)}>
        <Card style={styles.potholeCard}>
          <View style={styles.cardContent}>
            {/* Left side - Image and status */}
            <View style={styles.leftSection}>
              {pothole.image?.url ? (
                <Image 
                  source={{ uri: pothole.image.url }} 
                  style={styles.potholeImage} 
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: statusInfo.color }]}>
                  <Ionicons name="image" size={24} color="#fff" />
                </View>
              )}
              
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
              </View>
            </View>

            {/* Middle section - Details */}
            <View style={styles.middleSection}>
              <View style={styles.roadTypeContainer}>
                <Ionicons name={roadIcon} size={16} color={priorityInfo.color} />
                <Text style={styles.roadType}>{pothole.roadType}</Text>
              </View>
              
              <Text style={styles.status}>{pothole.status}</Text>
              
              <View style={styles.metaInfo}>
                <Text style={styles.metaText}>
                  📍 {pothole.location.coordinates[1].toFixed(4)}, {pothole.location.coordinates[0].toFixed(4)}
                </Text>
                <Text style={styles.metaText}>
                  📅 {new Date(pothole.createdAt).toLocaleDateString()}
                </Text>
              </View>
              
              {pothole.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {pothole.description}
                </Text>
              )}
            </View>

            {/* Right section - Priority and arrow */}
            <View style={styles.rightSection}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}>
                <Ionicons name={priorityInfo.icon} size={12} color="#fff" />
                <Text style={styles.priorityText}>{priorityInfo.text}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );
};

// Loading skeleton
const LoadingSkeleton = () => (
  <SkeletonPlaceholder>
    {[...Array(5)].map((_, index) => (
      <View key={index} style={styles.skeletonItem}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonMeta} />
        </View>
      </View>
    ))}
  </SkeletonPlaceholder>
);

// Statistics card
const StatsCard = ({ stats }) => {
  const total = stats?.totalPotholes || 0;
  const notFixed = stats?.statusBreakdown?.['Not Fixed']?.count || 0;
  const underProgress = stats?.statusBreakdown?.['Under Progress']?.count || 0;
  const fixed = stats?.statusBreakdown?.['Fixed']?.count || 0;

  return (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Status Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.notFixed }]}>{notFixed}</Text>
          <Text style={styles.statLabel}>Not Fixed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.underProgress }]}>{underProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.fixed }]}>{fixed}</Text>
          <Text style={styles.statLabel}>Fixed</Text>
        </View>
      </View>
    </Card>
  );
};

const StatusScreen = ({ navigation }) => {
  const { potholes, isLoading, filters } = useGlobalState();
  const { setPotholes, setSelectedPothole, setFilters, setError } = useGlobalActions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSortBy, setSelectedSortBy] = useState('priority');
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPotholes();
  }, [selectedStatus, selectedSortBy]);

  const loadData = async () => {
    await Promise.all([
      loadPotholes(),
      loadStats()
    ]);
  };

  const loadPotholes = async () => {
    try {
      const params = {
        ...(selectedStatus && { status: selectedStatus }),
        sortBy: selectedSortBy,
        sortOrder: 'asc',
        limit: 100,
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
    }
  };

  const loadStats = async () => {
    try {
      const response = await potholeAPI.getStatistics();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [selectedStatus, selectedSortBy]);

  const onPotholePress = (pothole) => {
    setSelectedPothole(pothole);
    navigation.navigate('PotholeDetail', { potholeId: pothole._id });
  };

  const getFilteredPotholes = () => {
    let filtered = [...potholes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pothole =>
        pothole.roadType.toLowerCase().includes(query) ||
        pothole.status.toLowerCase().includes(query) ||
        pothole.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const statusFilters = [
    { value: '', label: 'All', count: potholes.length },
    { value: 'Not Fixed', label: 'Not Fixed', emoji: '🟥', count: potholes.filter(p => p.status === 'Not Fixed').length },
    { value: 'Under Progress', label: 'In Progress', emoji: '🟨', count: potholes.filter(p => p.status === 'Under Progress').length },
    { value: 'Fixed', label: 'Fixed', emoji: '🟩', count: potholes.filter(p => p.status === 'Fixed').length },
  ];

  const sortOptions = [
    { value: 'priority', label: 'Priority' },
    { value: 'date', label: 'Date' },
    { value: 'status', label: 'Status' },
  ];

  const filteredPotholes = getFilteredPotholes();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Status Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {filteredPotholes.length} potholes {selectedStatus ? `(${selectedStatus})` : ''}
        </Text>
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search by road type, status, or description..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        {/* Status Filters */}
        <View style={styles.chipContainer}>
          {statusFilters.map((filter) => (
            <Chip
              key={filter.value}
              selected={selectedStatus === filter.value}
              onPress={() => setSelectedStatus(filter.value)}
              style={[
                styles.filterChip,
                selectedStatus === filter.value && styles.filterChipSelected
              ]}
              textStyle={styles.filterChipText}
            >
              {filter.emoji} {filter.label} ({filter.count})
            </Chip>
          ))}
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {sortOptions.map((option) => (
            <Chip
              key={option.value}
              selected={selectedSortBy === option.value}
              onPress={() => setSelectedSortBy(option.value)}
              style={[
                styles.sortChip,
                selectedSortBy === option.value && styles.sortChipSelected
              ]}
              textStyle={styles.sortChipText}
            >
              {option.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && !refreshing ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            data={filteredPotholes}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <PotholeItem
                pothole={item}
                onPress={onPotholePress}
                index={index}
              />
            )}
            ListHeaderComponent={stats ? <StatsCard stats={stats} /> : null}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No potholes found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search criteria' : 'Start by reporting a pothole'}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Report"
        onPress={() => navigation.navigate('Upload')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    marginTop: spacing.xs,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  searchBar: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  searchInput: {
    ...typography.body2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.background,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sortLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  sortChip: {
    backgroundColor: colors.background,
  },
  sortChipSelected: {
    backgroundColor: colors.primary,
  },
  sortChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  statsCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statsTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  potholeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  leftSection: {
    position: 'relative',
  },
  potholeImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  statusEmoji: {
    fontSize: 10,
  },
  middleSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  roadTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roadType: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  status: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaInfo: {
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    ...typography.caption,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
  },
  skeletonItem: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  skeletonMeta: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
});

export default StatusScreen;