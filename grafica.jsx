// Importamos React y hooks de estado y efecto
import React, { useState, useCallback } from 'react';
// Importamos componentes básicos de React Native
import { View, Text, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
// useRoute -> para recibir parámetros de la navegación
// useFocusEffect -> ejecuta código cada vez que la pantalla se enfoca
import { useRoute, useFocusEffect } from '@react-navigation/native';
// Importamos AsyncStorage para leer los registros guardados localmente
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importamos la librería de gráficos (gráfica de línea)
import { LineChart } from 'react-native-chart-kit'; 

// Obtenemos el ancho de la pantalla del dispositivo
const screenWidth = Dimensions.get('window').width;

// Definimos el componente principal
const DetalleGrafica = () => {
  // useRoute nos permite acceder a los parámetros enviados desde otra pantalla
  const route = useRoute();
  const { userName } = route.params;  // Nombre del usuario enviado desde la pantalla anterior
  
  // Estado local que guardará los registros del usuario (historial IMC)
  const [userRecords, setUserRecords] = useState([]);

  // ----------------------------------------------------------------
  // 📦 FUNCIÓN: Cargar y filtrar los registros guardados en AsyncStorage
  // ----------------------------------------------------------------
  const loadUserRecords = async () => {
    try {
      // Leemos el objeto "imcRecords" del almacenamiento local
      const stored = await AsyncStorage.getItem('imcRecords');
      if (stored !== null) {
        // Si existen registros, los convertimos desde JSON a array
        const allRecords = JSON.parse(stored);
        
        // 1️⃣ Filtramos los registros que pertenecen al usuario actual
        const filteredRecords = allRecords
          .filter(record => record.name === userName)
          // 2️⃣ Ordenamos los registros por fecha (de más antiguo a más reciente)
          .sort((a, b) => new Date(a.date) - new Date(b.date)); 

        // Guardamos los registros filtrados en el estado
        setUserRecords(filteredRecords);
      } else {
        // Si no hay registros, dejamos el estado vacío
        setUserRecords([]);
      }
    } catch (error) {
      console.log('Error al cargar y filtrar registros:', error);
    }
  };

  // ----------------------------------------------------------------
  // 🔄 useFocusEffect: ejecuta loadUserRecords cada vez que la pantalla se muestra
  // ----------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      loadUserRecords();
    }, [userName]) 
  );

  // ----------------------------------------------------------------
  // 📈 FUNCIÓN: Preparar los datos para la gráfica de IMC
  // ----------------------------------------------------------------
  const getChartData = () => {
    // Si no hay registros, devolvemos datos vacíos
    if (userRecords.length === 0) {
      return {
        labels: ["Sin datos"],
        datasets: [{ data: [0] }],
      };
    }

    // Mostramos solo los últimos 7 registros para no saturar la gráfica
    const recordsToShow = userRecords.slice(-7); 

    return {
      // Etiquetas del eje X: mes/día
      labels: recordsToShow.map(record => 
        new Date(record.date).toLocaleDateString('es-ES', { month: 'numeric', day: 'numeric' })
      ),
      datasets: [
        {
          // Eje Y: valores de IMC
          data: recordsToShow.map(record => parseFloat(record.imc)),
          color: (opacity = 1) => `rgba(85, 119, 204, ${opacity})`, // Línea azul
          strokeWidth: 2, // Grosor de línea
        },
      ],
      // Leyenda (se muestra sobre la gráfica)
      legend: [`IMC de ${userName}`],
    };
  };

  // Obtenemos los datos procesados
  const chartData = getChartData();

  // ----------------------------------------------------------------
  // 🎨 CONFIGURACIÓN VISUAL DE LA GRÁFICA
  // ----------------------------------------------------------------
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#e3e6f3',
    backgroundGradientTo: '#d6dafb',
    decimalPlaces: 2, // número de decimales en los valores
    color: (opacity = 1) => `rgba(58, 78, 140, ${opacity})`, // Color del texto y ejes
    labelColor: (opacity = 1) => `rgba(58, 78, 140, ${opacity})`,
    strokeWidth: 2,
    style: {
      borderRadius: 16
    },
    // Estilo de los puntos en la gráfica
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#5577cc',
    },
    // Líneas de fondo del gráfico (cuadrícula)
    propsForBackgroundLines: {
        strokeDasharray: '0',
        stroke: '#ccc',
    }
  };

  // ----------------------------------------------------------------
  // 🧾 TABLA DE REGISTROS (Encabezado y filas)
  // ----------------------------------------------------------------

  // Componente para los encabezados de la tabla
  const TableHeader = () => (
    <View style={graficaStyles.rowHeader}>
      <Text style={[graficaStyles.headerText, { flex: 1.5 }]}>Fecha</Text>
      <Text style={[graficaStyles.headerText, { flex: 1, textAlign: 'center' }]}>Peso (kg)</Text>
      <Text style={[graficaStyles.headerText, { flex: 1, textAlign: 'center' }]}>IMC</Text>
      <Text style={[graficaStyles.headerText, { flex: 1.5, textAlign: 'right' }]}>Clasificación</Text>
    </View>
  );

  // Renderiza cada fila del FlatList
  const renderItem = ({ item }) => {
    // Detectamos si es el último registro (más reciente)
    const isLatest = item.id === userRecords[userRecords.length - 1]?.id; 
    
    // Definimos colores según la clasificación del IMC
    const getClassificationColor = (classification) => {
      switch (classification) {
        case 'Bajo peso': return '#fce38a'; 
        case 'Peso normal': return '#a8ebc5'; 
        case 'Sobrepeso': return '#ffcf7c'; 
        case 'Obesidad': return '#ff8585'; 
        default: return 'white';
      }
    };

    return (
      <View
        style={[
          graficaStyles.row, 
          { backgroundColor: getClassificationColor(item.classification) },
          isLatest && graficaStyles.latestRow // Aplica borde y sombra al último registro
        ]}
      >
        {/* Fecha formateada */}
        <Text style={[graficaStyles.cellText, { flex: 1.5 }]}>
          {new Date(item.date).toLocaleDateString('es-ES')}
        </Text>
        {/* Peso */}
        <Text style={[graficaStyles.cellText, { flex: 1, textAlign: 'center' }]}>{item.weight}</Text>
        {/* IMC */}
        <Text style={[graficaStyles.cellText, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
          {item.imc}
        </Text>
        {/* Clasificación */}
        <Text style={[graficaStyles.cellText, { flex: 1.5, textAlign: 'right' }]}>{item.classification}</Text>
      </View>
    );
  };

  // ----------------------------------------------------------------
  // 🧭 INTERFAZ DE LA PANTALLA
  // ----------------------------------------------------------------
  return (
    <View style={graficaStyles.container}>
      <Text style={graficaStyles.title}>Historial de IMC</Text>
      <Text style={graficaStyles.subtext}>
        Progreso de: <Text style={{ fontWeight: 'bold', color: '#3a4e8c' }}>{userName}</Text>
      </Text>
      
      {/* Si hay al menos 2 registros, mostramos la gráfica */}
      {userRecords.length > 0 && userRecords.length > 1 ? (
        <ScrollView horizontal style={{ marginBottom: 20 }}>
          <View style={graficaStyles.chartWrapper}>
            <LineChart
                data={chartData}
                // Ancho dinámico para que se desplace si hay muchos puntos
                width={Math.max(screenWidth - 30, 70 * userRecords.length)} 
                height={220}
                chartConfig={chartConfig}
                bezier // Hace la línea curva
                style={graficaStyles.chartStyle}
            />
          </View>
        </ScrollView>
      ) : (
        // Si hay menos de 2 registros, mostramos un aviso
        <View style={graficaStyles.chartPlaceholder}>
            <Text style={graficaStyles.chartText}>Necesitas al menos 2 registros para ver la gráfica de progreso.</Text>
            <Text style={graficaStyles.chartText}>Actualmente tienes: {userRecords.length} registro(s).</Text>
        </View>
      )}

      {/* TABLA DE REGISTROS */}
      {userRecords.length > 0 ? (
        <>
          <Text style={graficaStyles.tableTitle}>Detalle de Registros</Text>
          <TableHeader />
          <FlatList
            data={userRecords}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListFooterComponent={<View style={{ height: 20 }} />} // Espacio inferior
          />
        </>
      ) : (
        <Text style={graficaStyles.subtext}>No hay registros de IMC para {userName}.</Text>
      )}
    </View>
  );
};

// ----------------------------------------------------------------
// 🎨 ESTILOS VISUALES (con StyleSheet)
// ----------------------------------------------------------------
const graficaStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a4e8c',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#5577cc',
    textAlign: 'center',
    marginBottom: 15,
  },
  chartWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#ebeefc',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#5577cc',
    borderStyle: 'dashed',
    padding: 10,
  },
  chartText: {
    fontSize: 16,
    color: '#3a4e8c',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3a4e8c',
    marginTop: 10,
    marginBottom: 5,
  },
  rowHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#5577cc',
    backgroundColor: '#e3e6f3',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3a4e8c',
    paddingHorizontal: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  latestRow: {
    borderWidth: 2,
    borderColor: '#3a4e8c',
    borderRadius: 8,
    marginVertical: 4,
    paddingVertical: 10,
    shadowColor: '#3a4e8c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 5,
  }
});

// Exportamos el componente
export default DetalleGrafica;
