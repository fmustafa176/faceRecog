import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ButtonsScreen() {
  const [button1Color, setButton1Color] = useState<'green' | 'gray'>('gray');
  const [button2Color, setButton2Color] = useState<'red' | 'gray'>('gray');

  const handleButton1Press = () => {
    setButton1Color('green');
    setButton2Color('gray'); // Reset other button
  };

  const handleButton2Press = () => {
    setButton2Color('red');
    setButton1Color('gray'); // Reset other button
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color Buttons</Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: button1Color === 'green' ? 'green' : 'lightgray' }
        ]}
        onPress={handleButton1Press}
      >
        <Text style={styles.buttonText}>
          {button1Color === 'green' ? 'Green Active!' : 'Make Green'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: button2Color === 'red' ? 'red' : 'lightgray' }
        ]}
        onPress={handleButton2Press}
      >
        <Text style={styles.buttonText}>
          {button2Color === 'red' ? 'Red Active!' : 'Make Red'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    width: 200,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});