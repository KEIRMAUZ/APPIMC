// Importamos React y algunos hooks de React
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Permite guardar datos localmente
// Hook para detectar cuando la pantalla se enfoca (similar a componentDidFocus)
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Librería de íconos de Expo (bonitos y ligeros)

// 📦 Estructura esperada de cada registro guardado:
// {
//   id: string,              // identificador único (timestamp)
//   name: string,            // nombre del usuario
//   gender: string,          // género
//   age: number,             // edad
//   weight: number,          // peso en kg
//   height: number,          // estatura en metros
//   imc: string,             // índice de masa corporal calculado
//   classification: string,  // categoría según el IMC (normal, sobrepeso, etc.)
//   date: string             // fecha guardada en texto
// }

const Registros = () => {
  // Estado que almacena todos los registros guardados
  const [records, setRecords] = useState([]);
  // Hook para poder navegar entre pantallas
  const navigation = useNavigation();

  // 🔄 Función para cargar los registros desde AsyncStorage
  const loadRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem('imcRecords'); // Obtiene los registros guardados
      if (stored !== null) {
        // Convierte el texto JSON en un arreglo de objetos
        const parsedRecords = JSON.parse(stored);
        // Ordena los registros del más reciente al más antiguo (por ID que es el timestamp)
        setRecords(parsedRecords.sort((a, b) => b.id - a.id));
      } else {
        // Si no hay nada almacenado, se establece como un arreglo vacío
        setRecords([]);
      }
    } catch (error) {
      console.log('Error al cargar registros:', error);
    }
  };

  // ⚙️ Hook que ejecuta una función cada vez que la pantalla "Registros" vuelve a estar activa
  useFocusEffect(
    useCallback(() => {
      loadRecords(); // Carga los registros cada vez que se entra a esta pestaña
    }, [])
  );

  // ❌ Función para eliminar un registro individual según su ID
  const deleteRecord = async (id) => {
    try {
      // Se filtran todos los registros excepto el que tenga el ID a eliminar
      const newRecords = records.filter(record => record.id !== id);
      // Se guardan los registros actualizados
      await AsyncStorage.setItem('imcRecords', JSON.stringify(newRecords));
      // Se actualiza el estado local para refrescar la lista en pantalla
      setRecords(newRecords);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el registro.');
      console.log('Error al eliminar registro:', error);
    }
  };

  // ⚠️ Función para eliminar todos los registros almacenados
  const deleteAllRecords = () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar TODOS los registros?', // Mensaje de confirmación
      [
        {
          text: 'Cancelar',
          style: 'cancel', // Cierra el modal sin hacer nada
        },
        {
          text: 'Eliminar todo',
          style: 'destructive', // Muestra el botón rojo
          onPress: async () => { // Si se confirma, ejecuta la eliminación
            try {
              // Elimina completamente la clave del almacenamiento
              await AsyncStorage.removeItem('imcRecords');
              // Limpia el estado local
              setRecords([]);
              Alert.alert('Éxito', 'Todos los registros han sido eliminados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar todos los registros.');
              console.log('Error al eliminar todos los registros:', error);
            }
          },
        },
      ],
      { cancelable: true } // Permite cerrar tocando fuera del modal
    );
  };

  // 🧱 Función que renderiza cada elemento (tarjeta) dentro de la lista
  const renderItem = ({ item }) => (
    <View style={registrosStyles.recordCard}>
      {/* Contenedor con los datos de cada registro */}
      <View style={registrosStyles.infoContainer}>
        <Text style={registrosStyles.recordName}>{item.name}</Text>
        <Text style={registrosStyles.recordDetail}>IMC: {item.imc} ({item.classification})</Text>
        <Text style={registrosStyles.recordDate}>Guardado: {item.date}</Text>
      </View>

      {/* Contenedor con los botones de acción */}
      <View style={registrosStyles.actionsContainer}>
        {/* 📈 Botón que lleva a la gráfica individual del usuario */}
        <TouchableOpacity
          style={registrosStyles.actionButton}
          onPress={() => navigation.navigate('DetalleGrafica', { userName: item.name })}
        >
          <Ionicons name="stats-chart" size={24} color="#3a4e8c" />
        </TouchableOpacity>

        {/* 🗑️ Botón que elimina este registro */}
        <TouchableOpacity
          style={[registrosStyles.actionButton, { marginLeft: 10 }]}
          onPress={() => deleteRecord(item.id)}
        >
          <Ionicons name="trash" size={24} color="#d9534f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 🖼️ Render principal del componente
  return (
    <View style={registrosStyles.container}>
      {records.length > 0 ? ( // Si hay registros...
        <>
          {/* 🔘 Botón que elimina todos los registros */}
          <TouchableOpacity 
            style={registrosStyles.deleteAllButton} 
            onPress={deleteAllRecords}
          >
            <Text style={registrosStyles.deleteAllButtonText}>
              Borrar Todos ({records.length})
            </Text>
          </TouchableOpacity>

          {/* 📋 Lista con todos los registros */}
          <FlatList
            data={records} // Fuente de datos
            renderItem={renderItem} // Cómo se dibuja cada registro
            keyExtractor={item => item.id} // Clave única
            contentContainerStyle={{ paddingBottom: 20 }} // Espacio inferior
          />
        </>
      ) : (
        // 🕳️ Vista cuando no hay registros guardados
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

// 🎨 Estilos visuales de la pantalla
const registrosStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  // 🕳️ Contenedor mostrado cuando no hay registros
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
  // 📄 Tarjeta individual del registro
  recordCard: {
    flexDirection: 'row', // Distribuye info y botones horizontalmente
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
    elevation: 3, // Sombra para Android
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
  // 🔘 Botón para eliminar todos los registros
  deleteAllButton: {
    backgroundColor: '#ffcdd2', // Rojo claro (advertencia)
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginRight: 5,
  },
  deleteAllButtonText: {
    color: '#d9534f', // Rojo fuerte
    fontWeight: 'bold',
  }
});

export default Registros;
