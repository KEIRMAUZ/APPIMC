import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';

import Registros from './registro';
import DetalleGrafica from './grafica';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// 🔹 Genera fecha en formato ISO (YYYY-MM-DD) con padding para meses/días de un dígito
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🔹 Convierte formato ISO a formato local (DD/MM/YYYY)
const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

function HomeScreen() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Hombre');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState('IMC');

  // ✅ Detección inteligente de género basado en registros previos
  const checkExistingUser = async (enteredName) => {
    if (!enteredName.trim()) return;

    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      const records = stored ? JSON.parse(stored) : [];

      // Búsqueda case-insensitive para mejor UX
      const existing = records.find(
        (r) => r.name.toLowerCase() === enteredName.toLowerCase().trim()
      );

      if (existing) {
        setGender(existing.gender); // Auto-completa género si el usuario existe
      }
    } catch (error) {
      console.log('Error al verificar usuario existente:', error);
    }
  };

  const handleNameChange = (text) => {
    setName(text);
    checkExistingUser(text);
  };

  // 🔹 Parsing seguro que retorna null en lugar de NaN
  const parseNumber = (text) => {
    const n = parseFloat(text);
    return isNaN(n) ? null : n;
  };

  // 🧮 Algoritmo principal de cálculo de IMC con validaciones
  const calculateIMC = async () => {
    const w = parseNumber(weight);
    const h = parseNumber(height);
    const a = parseNumber(age);

    // Validación en cascada con mensajes específicos
    if (!name.trim()) {
      setResult('Por favor, ingresa un nombre');
      return;
    }

    if (w === null || h === null || a === null) {
      setResult('Por favor, ingresa valores válidos (peso, altura, edad)');
      return;
    }

    if (w <= 0 || h <= 0 || a <= 0) {
      setResult('Los valores deben ser mayores que cero');
      return;
    }

    const todayDate = new Date();
    const heightInMeters = h / 100;
    const imc = w / (heightInMeters * heightInMeters);

    // 📊 Tablas de clasificación diferenciadas por género
    let classification = '';
    if (gender === 'Hombre') {
      if (imc < 20) classification = 'Bajo peso';
      else if (imc < 25) classification = 'Peso normal';
      else if (imc < 30) classification = 'Sobrepeso';
      else classification = 'Obesidad';
    } else {
      if (imc < 18) classification = 'Bajo peso';
      else if (imc < 24) classification = 'Peso normal';
      else if (imc < 29) classification = 'Sobrepeso';
      else classification = 'Obesidad';
    }

    // 📝 Construcción del objeto de registro con metadata
    const newResult = {
      id: Date.now().toString(), // Timestamp como ID único
      name: name.trim(),
      gender,
      age: a,
      weight: w,
      height: h,
      imc: imc.toFixed(2), // Precisión de 2 decimales
      classification,
      date: todayDate.toISOString(), // ISO string para ordenamiento consistente
    };

    setResult(
      `Nombre: ${name.trim()}\nFecha: ${formatDateDisplay(getTodayDateString())}\nIMC: ${imc.toFixed(
        2
      )} (${classification})`
    );

    // 🧹 Reset del formulario después del cálculo
    setName('');
    setWeight('');
    setHeight('');
    setAge('');

    // 💾 Persistencia en AsyncStorage con manejo de errores
    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      const records = stored ? JSON.parse(stored) : [];
      records.push(newResult);
      await AsyncStorage.setItem('imcRecords', JSON.stringify(records));
    } catch (error) {
      console.log('Error al guardar el registro:', error);
    }
  };

  // 🔐 Validador de input numérico que permite solo un punto decimal
  const handleChangeNum = (setter) => (text) => {
    const validText = text.replace(/[^0-9.]/g, ''); // Regex para caracteres válidos
    if ((validText.match(/\./g) || []).length > 1) return; // Previene múltiples puntos decimales
    setter(validText);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 🍎 Ajuste específico para iOS
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={handleNameChange}
        />

        <View style={styles.genderContainer}>
          {['Hombre', 'Mujer'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[styles.genderText, gender === g && styles.genderTextSelected]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputsContainer}>
          <View style={styles.dateDisplayContainer}>
            <Text style={styles.dateDisplayText}>
              Fecha del Cálculo: {formatDateDisplay(getTodayDateString())}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Peso (kg)"
            keyboardType="numeric"
            value={weight}
            onChangeText={handleChangeNum(setWeight)}
          />
          <TextInput
            style={styles.input}
            placeholder="Altura (cm)"
            keyboardType="numeric"
            value={height}
            onChangeText={handleChangeNum(setHeight)}
          />
          <TextInput
            style={styles.input}
            placeholder="Edad"
            keyboardType="numeric"
            value={age}
            onChangeText={handleChangeNum(setAge)}
          />
        </View>

        <TouchableOpacity style={styles.calculateButton} onPress={calculateIMC}>
          <Text style={styles.calculateButtonText}>Calcular IMC</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 🏗️ Navegación anidada: Drawer contiene Stack que contiene pantallas
function RegistrosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Registros" component={Registros} />
      <Stack.Screen name="DetalleGrafica" component={DetalleGrafica} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Inicio">
        <Drawer.Screen name="Inicio" component={HomeScreen} />
        <Drawer.Screen name="Historial" component={RegistrosStack} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f5',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  resultBox: {
    backgroundColor: '#e3e6f3',
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
    minHeight: 100, // 📏 Espacio garantizado para resultados multilínea
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 18,
    color: '#5577cc',
    fontWeight: '600',
    textAlign: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  genderButton: {
    backgroundColor: '#d6dafb',
    borderRadius: 25, // 🔵 Forma de píldora
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginHorizontal: 10,
  },
  genderButtonSelected: {
    backgroundColor: '#5577cc',
    shadowColor: '#5577cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // 📱 Sombra pronunciada en Android
  },
  genderText: {
    fontSize: 18,
    color: '#3a4e8c',
    fontWeight: '600',
  },
  genderTextSelected: {
    color: 'white',
  },
  inputsContainer: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#d6dafb',
    borderRadius: 12,
    height: 55,
    fontSize: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    color: '#3a4e8c',
    shadowColor: '#d6dafb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  dateDisplayContainer: {
    backgroundColor: '#ebeefc',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#d6dafb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  dateDisplayText: {
    fontSize: 18,
    color: '#5577cc',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#5577cc',
    borderRadius: 50, // 🔵 Botón completamente redondeado
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5577cc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12, // 🏔️ Máxima elevación para el CTA principal
  },
  calculateButtonText: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
});