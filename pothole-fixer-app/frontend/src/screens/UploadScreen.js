import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Button, Card, TextInput, ProgressBar } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import Modal from 'react-native-modal';

import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';
import { useGlobalState, useGlobalActions } from '../services/GlobalContext';
import { uploadWithProgress, handleApiError } from '../services/api';

const { width, height } = Dimensions.get('window');

const roadTypes = [
  { value: 'Highway', label: 'Highway', icon: 'car-sport', color: colors.highway, priority: 1 },
  { value: 'Main Road', label: 'Main Road', icon: 'car', color: colors.mainRoad, priority: 2 },
  { value: 'Inner Road', label: 'Inner Road', icon: 'bicycle', color: colors.innerRoad, priority: 3 },
  { value: 'Alley', label: 'Alley', icon: 'walk', color: colors.alley, priority: 4 },
];

const severityLevels = [
  { value: 'Low', label: 'Low', color: colors.success },
  { value: 'Medium', label: 'Medium', color: colors.warning },
  { value: 'High', label: 'High', color: colors.error },
  { value: 'Critical', label: 'Critical', color: colors.error },
];

const UploadScreen = () => {
  const { currentLocation, uploadProgress, isUploading } = useGlobalState();
  const { setUploadProgress, setUploading, addPothole, setError } = useGlobalActions();

  const [selectedImage, setSelectedImage] = useState(null);
  const [roadType, setRoadType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRoadTypeModal, setShowRoadTypeModal] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      setCoordinates(currentLocation);
    }
  }, [currentLocation]);

  const requestLocationPermission = async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to report potholes accurately.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return true;
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get current location');
      return false;
    } finally {
      setIsLocationLoading(false);
    }
  };

  const selectImage = () => {
    setShowImageModal(true);
  };

  const takePicture = async () => {
    try {
      setShowImageModal(false);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      setError('Failed to take picture');
    }
  };

  const pickFromGallery = async () => {
    try {
      setShowImageModal(false);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const validateForm = () => {
    if (!selectedImage) {
      Alert.alert('Missing Image', 'Please select or take a photo of the pothole');
      return false;
    }

    if (!coordinates) {
      Alert.alert('Missing Location', 'Please allow location access or manually set location');
      return false;
    }

    if (!roadType) {
      Alert.alert('Missing Road Type', 'Please select the type of road');
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const reportData = {
        image: selectedImage,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        roadType,
        severity,
        description: description.trim(),
      };

      const response = await uploadWithProgress(reportData, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Add to global state
        addPothole(response.data);

        // Reset form
        setSelectedImage(null);
        setRoadType('');
        setSeverity('Medium');
        setDescription('');
        setUploadProgress(0);

        Alert.alert(
          'Success! 🎉',
          'Pothole reported successfully. Thank you for helping improve our roads!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error uploading pothole:', error);
      const errorInfo = handleApiError(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Upload Failed',
        errorInfo.message || 'Failed to upload pothole report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Report Pothole</Text>
        <Text style={styles.headerSubtitle}>Help improve road safety</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        <Animatable.View animation="fadeInUp" delay={100}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Photo Evidence</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.imageSelector}
              onPress={selectImage}
              disabled={isUploading}
            >
              {selectedImage ? (
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={48} color={colors.textLight} />
                  <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>
        </Animatable.View>

        {/* Location */}
        <Animatable.View animation="fadeInUp" delay={200}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Location</Text>
            </View>
            
            {coordinates ? (
              <View style={styles.locationInfo}>
                <Text style={styles.coordinatesText}>
                  📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </Text>
                <TouchableOpacity 
                  style={styles.refreshLocationButton}
                  onPress={requestLocationPermission}
                  disabled={isLocationLoading}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text style={styles.refreshLocationText}>Update</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.getLocationButton}
                onPress={requestLocationPermission}
                disabled={isLocationLoading}
              >
                <Ionicons 
                  name="location-outline" 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.getLocationText}>
                  {isLocationLoading ? 'Getting Location...' : 'Get Current Location'}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        </Animatable.View>

        {/* Road Type */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="car" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Road Type</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.selector, roadType && styles.selectorSelected]}
              onPress={() => setShowRoadTypeModal(true)}
              disabled={isUploading}
            >
              {roadType ? (
                <View style={styles.selectedRoadType}>
                  <Ionicons 
                    name={roadTypes.find(r => r.value === roadType)?.icon} 
                    size={20} 
                    color={roadTypes.find(r => r.value === roadType)?.color} 
                  />
                  <Text style={styles.selectedRoadTypeText}>{roadType}</Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select road type</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </Card>
        </Animatable.View>

        {/* Severity */}
        <Animatable.View animation="fadeInUp" delay={400}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Severity Level</Text>
            </View>
            
            <View style={styles.severityContainer}>
              {severityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.severityButton,
                    severity === level.value && [
                      styles.severityButtonSelected,
                      { backgroundColor: level.color }
                    ]
                  ]}
                  onPress={() => setSeverity(level.value)}
                  disabled={isUploading}
                >
                  <Text
                    style={[
                      styles.severityButtonText,
                      severity === level.value && styles.severityButtonTextSelected
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animatable.View>

        {/* Description */}
        <Animatable.View animation="fadeInUp" delay={500}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Description (Optional)</Text>
            </View>
            
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the pothole condition..."
              multiline
              numberOfLines={3}
              maxLength={500}
              disabled={isUploading}
              mode="outlined"
              theme={{ colors: { primary: colors.primary } }}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </Card>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" delay={600}>
          {isUploading && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
              <ProgressBar 
                progress={uploadProgress / 100} 
                color={colors.primary}
                style={styles.progressBar}
              />
            </View>
          )}
          
          <Button
            mode="contained"
            onPress={submitReport}
            disabled={isUploading || !selectedImage || !coordinates || !roadType}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonText}
          >
            {isUploading ? 'Uploading...' : 'Submit Report'}
          </Button>
        </Animatable.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Selection Modal */}
      <Modal
        isVisible={showImageModal}
        onBackdropPress={() => setShowImageModal(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Image</Text>
          
          <TouchableOpacity style={styles.modalOption} onPress={takePicture}>
            <Ionicons name="camera" size={24} color={colors.primary} />
            <Text style={styles.modalOptionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
            <Ionicons name="images" size={24} color={colors.primary} />
            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalCancel} 
            onPress={() => setShowImageModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Road Type Selection Modal */}
      <Modal
        isVisible={showRoadTypeModal}
        onBackdropPress={() => setShowRoadTypeModal(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Road Type</Text>
          
          {roadTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={styles.roadTypeOption}
              onPress={() => {
                setRoadType(type.value);
                setShowRoadTypeModal(false);
              }}
            >
              <View style={styles.roadTypeOptionContent}>
                <Ionicons name={type.icon} size={24} color={type.color} />
                <View style={styles.roadTypeInfo}>
                  <Text style={styles.roadTypeLabel}>{type.label}</Text>
                  <Text style={styles.roadTypePriority}>Priority: {type.priority}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.modalCancel} 
            onPress={() => setShowRoadTypeModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body1,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
  },
  card: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h6,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  imageSelector: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textLight,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    ...typography.body2,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordinatesText: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
  },
  refreshLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  refreshLocationText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  getLocationButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  getLocationText: {
    ...typography.button,
    color: '#fff',
    marginLeft: spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderRadius: borderRadius.md,
  },
  selectorSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  selectorPlaceholder: {
    ...typography.body2,
    color: colors.textLight,
  },
  selectedRoadType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedRoadTypeText: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.textLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  severityButtonSelected: {
    borderColor: 'transparent',
  },
  severityButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  severityButtonTextSelected: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: colors.surface,
  },
  characterCount: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginVertical: spacing.md,
  },
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginVertical: spacing.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  submitButtonText: {
    ...typography.button,
    color: '#fff',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  modalOptionText: {
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.md,
  },
  modalCancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  roadTypeOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  roadTypeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadTypeInfo: {
    marginLeft: spacing.md,
  },
  roadTypeLabel: {
    ...typography.body1,
    color: colors.text,
  },
  roadTypePriority: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default UploadScreen;