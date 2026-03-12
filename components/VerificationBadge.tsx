import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationStatus } from '../lib/types';

interface VerificationBadgeProps {
  status?: VerificationStatus;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status = 'unverified',
  size = 'medium',
  showText = true,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'verified':
        return styles.verified;
      case 'pending':
        return styles.pending;
      case 'rejected':
        return styles.rejected;
      default:
        return styles.unverified;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      default:
        return 'alert-circle';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), getSizeStyle()]}>
      <Ionicons 
        name={getIcon()} 
        size={getIconSize()} 
        color="#FFF" 
      />
      {showText && (
        <Text style={[styles.text, getSizeStyle()]}>
          {status === 'verified' ? 'Verified' : 
           status === 'pending' ? 'Pending' : 
           status === 'rejected' ? 'Rejected' : 'Unverified'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  verified: {
    backgroundColor: '#00C853',
  },
  pending: {
    backgroundColor: '#FF9800',
  },
  rejected: {
    backgroundColor: '#FF3B30',
  },
  unverified: {
    backgroundColor: '#9CA3AF',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  smallText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  largeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default VerificationBadge;
