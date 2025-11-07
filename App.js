// Importaciones básicas de React y sus hooks
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para guardar los registros localmente en el dispositivo
import { NavigationContainer } from '@react-navigation/native'; // Contenedor principal de la navegación
import { createDrawerNavigator } from '@react-navigation/drawer'; // Navegación lateral tipo cajón
import { createStackNavigator } from '@react-navigation/stack'; // Navegación apilada entre pantallas

// Componentes de la app (pantallas)
import Registros from './registro';       // Vista del historial de IMC
import DetalleGrafica from './grafica';   // Vista con la gráfica individual del usuario

// Se crean los objetos de navegación
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();


// 🔹 Función que devuelve la fecha actual en formato "YYYY-MM-DD"
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Se asegura de tener dos dígitos
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🔹 Convierte una fecha "YYYY-MM-DD" a formato "DD/MM/YYYY" para mostrarla más amigable
const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};



// ==============================
// 🏠 COMPONENTE PRINCIPAL HOME
// ==============================
function HomeScreen() {
  // Estados del formulario
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Hombre');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState('IMC');

  // ✅ Verifica si el usuario ya tiene un registro previo y carga su género automáticamente
  const checkExistingUser = async (enteredName) => {
    if (!enteredName.trim()) return;

    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      const records = stored ? JSON.parse(stored) : [];

      // Busca coincidencias de nombre (ignorando mayúsculas/minúsculas)
      const existing = records.find(
        (r) => r.name.toLowerCase() === enteredName.toLowerCase().trim()
      );

      if (existing) {
        setGender(existing.gender); // Si lo encuentra, establece su género automáticamente
      }
    } catch (error) {
      console.log('Error al verificar usuario existente:', error);
    }
  };

  // Maneja los cambios en el campo "Nombre"
  const handleNameChange = (text) => {
    setName(text);
    checkExistingUser(text); // Cada vez que el nombre cambia, se verifica si ya existe
  };

  // 🔹 Convierte texto en número de forma segura
  const parseNumber = (text) => {
    const n = parseFloat(text);
    return isNaN(n) ? null : n;
  };



  // ===============================
  // 🧮 Función para calcular el IMC
  // ===============================
  const calculateIMC = async () => {
    const w = parseNumber(weight);
    const h = parseNumber(height);
    const a = parseNumber(age);

    // Validaciones básicas de campos
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

    // 📅 Se usa la fecha actual automáticamente
    const todayDate = new Date();

    // Cálculo matemático del IMC
    const heightInMeters = h / 100;
    const imc = w / (heightInMeters * heightInMeters);

    // Clasificación de acuerdo al género y valor del IMC
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

    // Crea un nuevo registro con todos los datos del cálculo
    const newResult = {
      id: Date.now().toString(), // Marca de tiempo única
      name: name.trim(),
      gender,
      age: a,
      weight: w,
      height: h,
      imc: imc.toFixed(2),
      classification,
      date: todayDate.toISOString(), // Guarda la fecha exacta en formato ISO
    };

    // Muestra el resultado en pantalla
    setResult(
      `Nombre: ${name.trim()}\nFecha: ${formatDateDisplay(getTodayDateString())}\nIMC: ${imc.toFixed(
        2
      )} (${classification})`
    );

    // Limpia los campos del formulario
    setName('');
    setWeight('');
    setHeight('');
    setAge('');

    // Guarda el registro en el almacenamiento local
    try {
      const stored = await AsyncStorage.getItem('imcRecords');
      const records = stored ? JSON.parse(stored) : [];
      records.push(newResult);
      await AsyncStorage.setItem('imcRecords', JSON.stringify(records));
    } catch (error) {
      console.log('Error al guardar el registro:', error);
    }
  };



  // 🔹 Valida el texto ingresado en los campos numéricos (peso, altura, edad)
  const handleChangeNum = (setter) => (text) => {
    const validText = text.replace(/[^0-9.]/g, ''); // Solo permite números y un punto
    if ((validText.match(/\./g) || []).length > 1) return; // Evita múltiples puntos
    setter(validText);
  };



  // ====================================
  // 🧱 INTERFAZ DE LA PANTALLA PRINCIPAL
  // ====================================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {/* Cuadro que muestra el resultado */}
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>

        {/* Campo de texto para el nombre */}
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={handleNameChange}
        />

        {/* Botones de selección de género */}
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

        {/* Campos numéricos y fecha fija */}
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

        {/* Botón para calcular el IMC */}
        <TouchableOpacity style={styles.calculateButton} onPress={calculateIMC}>
          <Text style={styles.calculateButtonText}>Calcular IMC</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



// ===========================================
// 📚 Navegación interna entre Registros y Gráfica
// ===========================================
function RegistrosStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Registros" component={Registros} />
      <Stack.Screen name="DetalleGrafica" component={DetalleGrafica} />
    </Stack.Navigator>
  );
}



// ===========================================
// 🧭 Navegación principal tipo Drawer (Cajón)
// ===========================================
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



// ==========================================
// 🎨 ESTILOS (Diseño visual de la app)
// ==========================================
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
    minHeight: 100,
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
    borderRadius: 25,
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
    elevation: 8,
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
  // Muestra la fecha fija (solo visual, no editable)
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
    borderRadius: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5577cc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  calculateButtonText: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
});
