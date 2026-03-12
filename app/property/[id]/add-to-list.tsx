import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LISTS_KEY = '@hommie:user-lists';

interface UserList {
  id: string;
  name: string;
  propertyIds: string[];
  created_at: string;
}

export default function AddToListScreen() {
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  useAuth(); // lists are in AsyncStorage; user not used on this screen
  const [lists, setLists] = useState<UserList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const data = await AsyncStorage.getItem(LISTS_KEY);
      if (data) {
        setLists(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const saveLists = async (updatedLists: UserList[]) => {
    try {
      await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updatedLists));
      setLists(updatedLists);
    } catch (error) {
      console.error('Error saving lists:', error);
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!propertyId) return;

    const updatedLists = lists.map((list) => {
      if (list.id === listId) {
        if (!list.propertyIds.includes(propertyId)) {
          return {
            ...list,
            propertyIds: [...list.propertyIds, propertyId],
          };
        }
      }
      return list;
    });

    await saveLists(updatedLists);
    Alert.alert('Success', 'Property added to list', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    setLoading(true);
    try {
      const newList: UserList = {
        id: `list_${Date.now()}`,
        name: newListName.trim(),
        propertyIds: propertyId ? [propertyId] : [],
        created_at: new Date().toISOString(),
      };

      const updatedLists = [newList, ...lists];
      await saveLists(updatedLists);
      setNewListName('');
      setShowNewListModal(false);
      Alert.alert('Success', 'List created and property added', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  const isPropertyInList = (list: UserList) => {
    return propertyId ? list.propertyIds.includes(propertyId) : false;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add to List</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.newListButton}
          onPress={() => setShowNewListModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#0066FF" />
          <Text style={styles.newListButtonText}>Create New List</Text>
        </TouchableOpacity>

        {lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No lists yet</Text>
            <Text style={styles.emptySubtext}>Create your first list to save properties</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => handleAddToList(item.id)}
                disabled={isPropertyInList(item)}
              >
                <View style={styles.listIcon}>
                  <Ionicons name="heart" size={24} color="#0066FF" />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listCount}>
                    {item.propertyIds.length} {item.propertyIds.length === 1 ? 'property' : 'properties'}
                  </Text>
                </View>
                {isPropertyInList(item) ? (
                  <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal
        visible={showNewListModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter list name"
              placeholderTextColor="#999"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setShowNewListModal(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave, loading && styles.modalSaveDisabled]}
                onPress={handleCreateList}
                disabled={loading}
              >
                <Text style={styles.modalSaveText}>{loading ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
  },
  newListButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  listIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalSave: {
    backgroundColor: '#0066FF',
  },
  modalSaveDisabled: {
    opacity: 0.6,
  },
  modalCancelText: {
    color: '#000',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
