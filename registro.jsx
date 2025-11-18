import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Registros = () => {
  const [records, setRecords] = useState([]);
  const navigation = useNavigation();

  // 🔄 Carga asíncrona con ordenamiento descendente por timestamp
  const loadRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      if (stored !== null) {
        const parsedRecords = JSON.parse(stored);
        // ⏰ Ordena de más reciente a más antiguo usando ID (timestamp)
        setRecords(parsedRecords.sort((a, b) => b.id - a.id));
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.log('Error al cargar registros:', error);
    }
  };

  // 📱 Recarga automática al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  // 🗑️ Eliminación individual con actualización inmediata del estado
  const deleteRecord = async (id) => {
    try {
      const newRecords = records.filter(record => record.id !== id);
      await AsyncStorage.setItem('imcRecords', JSON.stringify(newRecords));
      setRecords(newRecords); // ⚡ Actualización optimista
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el registro.');
      console.log('Error al eliminar registro:', error);
    }
  };

  // ⚠️ Modal de confirmación para eliminación masiva
  const deleteAllRecords = () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar TODOS los registros?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar todo',
          style: 'destructive', // 🔴 Estilo destructivo nativo
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('imcRecords');
              setRecords([]);
              Alert.alert('Éxito', 'Todos los registros han sido eliminados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar todos los registros.');
              console.log('Error al eliminar todos los registros:', error);
            }
          },
        },
      ],
      { cancelable: true } // 👆 Cierre táctil externo
    );
  };

  // 🎪 Renderizado de tarjetas con acciones contextuales
  const renderItem = ({ item }) => (
    <View style={registrosStyles.recordCard}>
      <View style={registrosStyles.infoContainer}>
        <Text style={registrosStyles.recordName}>{item.name}</Text>
        <Text style={registrosStyles.recordDetail}>IMC: {item.imc} ({item.classification})</Text>
        <Text style={registrosStyles.recordDate}>Guardado: {item.date}</Text>
      </View>

      <View style={registrosStyles.actionsContainer}>
        {/* 📈 Navegación parametrizada a gráficas individuales */}
        <TouchableOpacity
          style={registrosStyles.actionButton}
          onPress={() => navigation.navigate('DetalleGrafica', { userName: item.name })}
        >
          <Ionicons name="stats-chart" size={24} color="#3a4e8c" />
        </TouchableOpacity>

        {/* 🗑️ Eliminación inline con feedback visual */}
        <TouchableOpacity
          style={[registrosStyles.actionButton, { marginLeft: 10 }]}
          onPress={() => deleteRecord(item.id)}
        >
          <Ionicons name="trash" size={24} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={registrosStyles.container}>
      {records.length > 0 ? (
        <>
          {/* 🔘 Botón flotante de eliminación masiva con contador */}
          <TouchableOpacity 
            style={registrosStyles.deleteAllButton} 
            onPress={deleteAllRecords}
          >
            <Text style={registrosStyles.deleteAllButtonText}>
              Borrar Todos ({records.length})
            </Text>
          </TouchableOpacity>

          <FlatList
            data={records}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </>
      ) : (
        // 🕳️ Estado vacío con UX amigable
        <View style={registrosStyles.emptyContainer}>
          <Ionicons name="sad-outline" size={60} color="#5577cc" />
          <Text style={registrosStyles.emptyText}>No hay registros guardados.</Text>
          <Text style={registrosStyles.emptySubtext}>
            Ve a la pestaña "Inicio" para calcular y guardar tu primer IMC.
          </Text>
        </View>
      )}
    </View>
  );
};

const registrosStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a4e8c',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#5577cc',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 5,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // 📱 Sombra Android
  },
  infoContainer: {
    flex: 1,
  },
  recordName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3a4e8c',
    marginBottom: 2,
  },
  recordDetail: {
    fontSize: 14,
    color: '#5577cc',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#888',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  deleteAllButton: {
    backgroundColor: '#ffcdd2', // 🎨 Color semántico de advertencia
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-end', // ➡️ Alineación contextual
    marginBottom: 15,
    marginRight: 5,
  },
  deleteAllButtonText: {
    color: '#d9534f',
    fontWeight: 'bold',
  }
});

export default Registros;