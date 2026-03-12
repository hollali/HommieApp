import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const lists = [
  { id: '1', name: 'Apartment in East Legon', count: 10 },
  { id: '2', name: 'Rental in Lapaz', count: 5 },
  { id: '3', name: 'New listings', count: 24 },
  { id: '4', name: 'Apartment in Madina', count: 10 },
];

export default function YourListScreen() {
  const [userLists, setUserLists] = useState(lists);
  const [newListCount, setNewListCount] = useState(1);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your List</Text>
        <TouchableOpacity
          style={styles.newListButton}
          onPress={() => {
            const nextCount = newListCount + 1;
            setNewListCount(nextCount);
            setUserLists((prev) => [
              {
                id: `new_${Date.now()}`,
                name: `New List ${nextCount}`,
                count: 0,
              },
              ...prev,
            ]);
          }}
        >
          <Text style={styles.newListText}>New List</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={userLists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ListItem
            list={item}
            onOpenMenu={(listId, listName) => {
              Alert.alert('List Options', listName, [
                {
                  text: 'Rename',
                  onPress: () => {
                    setRenameId(listId);
                    setRenameValue(listName);
                    setRenameOpen(true);
                  },
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Delete List', 'This action cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          setUserLists((prev) => prev.filter((l) => l.id !== listId));
                        },
                      },
                    ]);
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          />
        )}
      />

      <Modal
        visible={renameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter list name"
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setRenameOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={() => {
                  if (!renameId || !renameValue.trim()) return;
                  setUserLists((prev) =>
                    prev.map((l) =>
                      l.id === renameId ? { ...l, name: renameValue.trim() } : l
                    )
                  );
                  setRenameOpen(false);
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ListItem({
  list,
  onOpenMenu,
}: {
  list: any;
  onOpenMenu: (id: string, name: string) => void;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => router.push(`/lists/${list.id}`)}
    >
      <View style={styles.listIcon}>
        <Ionicons name="heart" size={24} color="#0066FF" />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.listCount}>{list.count} Locations</Text>
      </View>
      <TouchableOpacity onPress={() => onOpenMenu(list.id, list.name)}>
        <Ionicons name="ellipsis-vertical" size={20} color="#000" />
      </TouchableOpacity>
    </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  newListButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newListText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: '#4560F7',
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

