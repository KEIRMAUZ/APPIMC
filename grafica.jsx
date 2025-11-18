import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

const DetalleGrafica = () => {
  const route = useRoute();
  const { userName } = route.params;
  
  const [userRecords, setUserRecords] = useState([]);

  // 🔄 Carga y filtrado inteligente de registros por usuario
  const loadUserRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      if (stored !== null) {
        const allRecords = JSON.parse(stored);
        
        // 🎯 Filtrado por nombre + ordenamiento cronológico
        const filteredRecords = allRecords
          .filter(record => record.name === userName)
          .sort((a, b) => new Date(a.date) - new Date(b.date)); 

        setUserRecords(filteredRecords);
      } else {
        setUserRecords([]);
      }
    } catch (error) {
      console.log('Error al cargar y filtrar registros:', error);
    }
  };

  // 📱 Recarga automática cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      loadUserRecords();
    }, [userName]) 
  );

  // 📊 Transformación de datos para la librería de gráficos
  const getChartData = () => {
    if (userRecords.length === 0) {
      return {
        labels: ["Sin datos"],
        datasets: [{ data: [0] }],
      };
    }

    // 🔢 Limita a últimos 7 registros para legibilidad
    const recordsToShow = userRecords.slice(-7); 

    return {
      // 📅 Formatea fechas como "MM/DD" para eje X
      labels: recordsToShow.map(record => 
        new Date(record.date).toLocaleDateString('es-ES', { month: 'numeric', day: 'numeric' })
      ),
      datasets: [
        {
          data: recordsToShow.map(record => parseFloat(record.imc)),
          color: (opacity = 1) => `rgba(85, 119, 204, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: [`IMC de ${userName}`],
    };
  };

  const chartData = getChartData();

  // 🎨 Configuración visual del componente LineChart
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#e3e6f3',
    backgroundGradientTo: '#d6dafb',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(58, 78, 140, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(58, 78, 140, ${opacity})`,
    strokeWidth: 2,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#5577cc',
    },
    propsForBackgroundLines: {
        strokeDasharray: '0', // 🔲 Líneas de cuadrícula continuas
        stroke: '#ccc',
    }
  };

  // 🏗️ Componente reutilizable para encabezado de tabla
  const TableHeader = () => (
    <View style={graficaStyles.rowHeader}>
      <Text style={[graficaStyles.headerText, { flex: 1.5 }]}>Fecha</Text>
      <Text style={[graficaStyles.headerText, { flex: 1, textAlign: 'center' }]}>Peso (kg)</Text>
      <Text style={[graficaStyles.headerText, { flex: 1, textAlign: 'center' }]}>IMC</Text>
      <Text style={[graficaStyles.headerText, { flex: 1.5, textAlign: 'right' }]}>Clasificación</Text>
    </View>
  );

  // 🎪 Renderizado condicional con sistema de colores semánticos
  const renderItem = ({ item }) => {
    const isLatest = item.id === userRecords[userRecords.length - 1]?.id; 
    
    // 🎨 Mapeo de clasificaciones IMC a colores visualmente significativos
    const getClassificationColor = (classification) => {
      switch (classification) {
        case 'Bajo peso': return '#fce38a'; // 🟡 Amarillo - advertencia
        case 'Peso normal': return '#a8ebc5'; // 🟢 Verde - positivo
        case 'Sobrepeso': return '#ffcf7c'; // 🟠 Naranja - precaución
        case 'Obesidad': return '#ff8585'; // 🔴 Rojo - alerta
        default: return 'white';
      }
    };

    return (
      <View
        style={[
          graficaStyles.row, 
          { backgroundColor: getClassificationColor(item.classification) },
          isLatest && graficaStyles.latestRow // 💎 Destaca el registro más reciente
        ]}
      >
        <Text style={[graficaStyles.cellText, { flex: 1.5 }]}>
          {new Date(item.date).toLocaleDateString('es-ES')}
        </Text>
        <Text style={[graficaStyles.cellText, { flex: 1, textAlign: 'center' }]}>{item.weight}</Text>
        <Text style={[graficaStyles.cellText, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
          {item.imc}
        </Text>
        <Text style={[graficaStyles.cellText, { flex: 1.5, textAlign: 'right' }]}>{item.classification}</Text>
      </View>
    );
  };

  return (
    <View style={graficaStyles.container}>
      <Text style={graficaStyles.title}>Historial de IMC</Text>
      <Text style={graficaStyles.subtext}>
        Progreso de: <Text style={{ fontWeight: 'bold', color: '#3a4e8c' }}>{userName}</Text>
      </Text>
      
      {/* 📈 Gráfica con scroll horizontal para múltiples puntos */}
      {userRecords.length > 0 && userRecords.length > 1 ? (
        <ScrollView horizontal style={{ marginBottom: 20 }}>
          <View style={graficaStyles.chartWrapper}>
            <LineChart
                data={chartData}
                // 📏 Ancho adaptable: mínimo ancho de pantalla o 70px por registro
                width={Math.max(screenWidth - 30, 70 * userRecords.length)} 
                height={220}
                chartConfig={chartConfig}
                bezier // ➰ Suaviza la línea con curvas Bézier
                style={graficaStyles.chartStyle}
            />
          </View>
        </ScrollView>
      ) : (
        <View style={graficaStyles.chartPlaceholder}>
            <Text style={graficaStyles.chartText}>Necesitas al menos 2 registros para ver la gráfica de progreso.</Text>
            <Text style={graficaStyles.chartText}>Actualmente tienes: {userRecords.length} registro(s).</Text>
        </View>
      )}

      {/* 📊 Tabla de datos con estado vacío manejado */}
      {userRecords.length > 0 ? (
        <>
          <Text style={graficaStyles.tableTitle}>Detalle de Registros</Text>
          <TableHeader />
          <FlatList
            data={userRecords}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />
        </>
      ) : (
        <Text style={graficaStyles.subtext}>No hay registros de IMC para {userName}.</Text>
      )}
    </View>
  );
};

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
    overflow: 'hidden', // ✂️ Recorta contenido que sobresale de los bordes redondeados
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
    borderStyle: 'dashed', // ⚫ Borde punteado para indicar área vacía
    padding: 10,
  },
  chartText: {
    fontSize: 16,
    color: '#3a4e8c',
    fontStyle: 'italic', // 🔤 Cursiva para texto informativo
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
    borderBottomWidth: 2, // 🟦 Línea más gruesa para encabezado
    borderBottomColor: '#5577cc',
    backgroundColor: '#e3e6f3',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8, // 🔵 Solo redondea esquinas superiores
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
    elevation: 4, // 💡 Efecto de elevación para registro actual
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 5,
  }
});

export default DetalleGrafica;