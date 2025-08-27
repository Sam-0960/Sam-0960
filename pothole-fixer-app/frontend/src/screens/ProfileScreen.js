import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Switch, Button, Divider } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';

import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';
import { useGlobalState, useGlobalActions } from '../services/GlobalContext';

const ProfileScreen = ({ navigation }) => {
  const { user, theme, isAuthenticated } = useGlobalState();
  const { setTheme, logout } = useGlobalActions();

  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  const profileStats = {
    reportsSubmitted: 12,
    pointsEarned: 450,
    badgesEarned: 3,
    level: 5,
  };

  const badges = [
    { name: 'First Reporter', description: 'Reported your first pothole', icon: '🎯', earned: true },
    { name: 'Community Helper', description: 'Reported 10 potholes', icon: '🏆', earned: true },
    { name: 'Road Warrior', description: 'Reported 50 potholes', icon: '⭐', earned: false },
    { name: 'Perfect Week', description: 'Reported potholes 7 days in a row', icon: '🔥', earned: false },
  ];

  const handleThemeToggle = (isDark) => {
    setTheme(isDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            // Navigate to auth screen would go here
          }
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://potholefixer.com/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://potholefixer.com/terms');
  };

  const sendFeedback = () => {
    Linking.openURL('mailto:feedback@potholefixer.com?subject=App Feedback');
  };

  const shareApp = () => {
    // Share functionality would go here
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  );

  const BadgeItem = ({ badge }) => (
    <View style={[styles.badgeItem, !badge.earned && styles.badgeItemDisabled]}>
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeName, !badge.earned && styles.badgeNameDisabled]}>
          {badge.name}
        </Text>
        <Text style={[styles.badgeDescription, !badge.earned && styles.badgeDescriptionDisabled]}>
          {badge.description}
        </Text>
      </View>
      {badge.earned && (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      )}
    </View>
  );

  const MenuSection = ({ title, children }) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <Card style={styles.menuCard}>
        {children}
      </Card>
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, rightComponent, showDivider = true }) => (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>{title}</Text>
            {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.menuItemRight}>
          {rightComponent || <Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
        </View>
      </TouchableOpacity>
      {showDivider && <Divider />}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.username || 'Anonymous User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'guest@potholefixer.com'}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {profileStats.level}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Animatable.View animation="fadeInUp" delay={100}>
          <View style={styles.statsContainer}>
            <StatCard
              title="Reports"
              value={profileStats.reportsSubmitted}
              icon="flag"
              color={colors.primary}
            />
            <StatCard
              title="Points"
              value={profileStats.pointsEarned}
              icon="star"
              color={colors.secondary}
            />
            <StatCard
              title="Badges"
              value={profileStats.badgesEarned}
              icon="trophy"
              color={colors.success}
            />
          </View>
        </Animatable.View>

        {/* Badges */}
        <Animatable.View animation="fadeInUp" delay={200}>
          <MenuSection title="Achievements">
            {badges.map((badge, index) => (
              <BadgeItem key={index} badge={badge} />
            ))}
          </MenuSection>
        </Animatable.View>

        {/* App Settings */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <MenuSection title="App Settings">
            <MenuItem
              icon="moon"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightComponent={
                <Switch
                  value={theme === 'dark'}
                  onValueChange={handleThemeToggle}
                  color={colors.primary}
                />
              }
            />
            <MenuItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive updates about your reports"
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={colors.primary}
                />
              }
            />
            <MenuItem
              icon="location"
              title="Location Sharing"
              subtitle="Allow app to access your location"
              rightComponent={
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                  color={colors.primary}
                />
              }
              showDivider={false}
            />
          </MenuSection>
        </Animatable.View>

        {/* App Info */}
        <Animatable.View animation="fadeInUp" delay={400}>
          <MenuSection title="About">
            <MenuItem
              icon="share"
              title="Share App"
              subtitle="Tell others about Pothole Fixer"
              onPress={shareApp}
            />
            <MenuItem
              icon="mail"
              title="Send Feedback"
              subtitle="Help us improve the app"
              onPress={sendFeedback}
            />
            <MenuItem
              icon="document-text"
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={openPrivacyPolicy}
            />
            <MenuItem
              icon="document"
              title="Terms of Service"
              subtitle="App usage terms and conditions"
              onPress={openTerms}
              showDivider={false}
            />
          </MenuSection>
        </Animatable.View>

        {/* Account Actions */}
        {isAuthenticated && (
          <Animatable.View animation="fadeInUp" delay={500}>
            <MenuSection title="Account">
              <MenuItem
                icon="log-out"
                title="Logout"
                subtitle="Sign out of your account"
                onPress={handleLogout}
                showDivider={false}
              />
            </MenuSection>
          </Animatable.View>
        )}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Pothole Fixer v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for better roads</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h5,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileEmail: {
    ...typography.body2,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  levelText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menuSection: {
    marginVertical: spacing.md,
  },
  menuSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  menuItemTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuItemRight: {
    marginLeft: spacing.md,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  badgeItemDisabled: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  badgeNameDisabled: {
    color: colors.textLight,
  },
  badgeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeDescriptionDisabled: {
    color: colors.textLight,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textLight,
  },
  versionSubtext: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default ProfileScreen;