import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSavedPaymentMethods, 
  removeSavedPaymentMethod, 
  setDefaultPaymentMethod,
  formatPaymentMethodDisplay,
  getPaymentMethodIcon,
  SavedPaymentMethod 
} from '../../lib/paymentMethods';

export default function SavedPaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: savedMethods = [], isLoading } = useQuery({
    queryKey: ['savedPaymentMethods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await getSavedPaymentMethods();
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: removeSavedPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPaymentMethods', user?.id] });
      Alert.alert('Success', 'Payment method removed successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to remove payment method');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPaymentMethods', user?.id] });
      Alert.alert('Success', 'Default payment method updated');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update default payment method');
    },
  });

  const handleRemove = (method: SavedPaymentMethod) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${formatPaymentMethodDisplay(method)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeMutation.mutate(method.id)
        },
      ]
    );
  };

  const handleSetDefault = (method: SavedPaymentMethod) => {
    if (method.isDefault) return;
    setDefaultMutation.mutate(method.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['savedPaymentMethods', user?.id] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : savedMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No saved payment methods</Text>
            <Text style={styles.emptyText}>
              Add payment methods to use them as shortcuts for future bookings
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.back()}
            >
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.methodsContainer}>
              {savedMethods.map((method) => (
                <View key={method.id} style={styles.methodCard}>
                  <View style={styles.methodLeft}>
                    <View style={styles.methodIcon}>
                      <Ionicons 
                        name={getPaymentMethodIcon(method.type)} 
                        size={24} 
                        color="#0066FF" 
                      />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>
                        {formatPaymentMethodDisplay(method)}
                      </Text>
                      <Text style={styles.methodDescription}>
                        {method.isDefault ? 'Default payment method' : 'Tap to set as default'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.methodActions}>
                    {!method.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(method)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Ionicons name="star-outline" size={20} color="#666" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleRemove(method)}
                      disabled={removeMutation.isPending}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addNewButton}
              onPress={() => router.back()}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0066FF" />
              <Text style={styles.addNewButtonText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  addButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#666',
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
});
