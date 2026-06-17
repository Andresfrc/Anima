import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, Pressable, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CognitiveGroundingProps {
  senseCount: number; // Will be 2 for smell, 1 for taste
  onComplete: () => void;
}

export function CognitiveGrounding({ senseCount, onComplete }: CognitiveGroundingProps) {
  const [inputs, setInputs] = useState<string[]>(Array(senseCount).fill(''));
  
  const isComplete = inputs.every(val => val.trim().length > 2);

  const handleTextChange = (text: string, index: number) => {
    const newInputs = [...inputs];
    newInputs[index] = text;
    setInputs(newInputs);
  };

  const submit = () => {
    if (isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <View style={styles.wrapper}>
        {inputs.map((val, i) => (
          <Animated.View key={i} entering={SlideInRight.delay(i * 150)} style={styles.inputBox}>
            <Ionicons 
              name={senseCount === 2 ? 'rose-outline' : 'restaurant-outline'} 
              size={24} 
              color={val.length > 2 ? "#38BDF8" : "rgba(255,255,255,0.4)"} 
            />
            <TextInput
              style={styles.input}
              placeholder={senseCount === 2 ? `Aroma reconfortante ${i + 1}...` : "Un sabor agradable..."}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val}
              onChangeText={(text) => handleTextChange(text, i)}
              maxLength={40}
              returnKeyType={i === senseCount - 1 ? "done" : "next"}
              onSubmitEditing={i === senseCount - 1 ? submit : undefined}
            />
          </Animated.View>
        ))}

        <Animated.View entering={FadeIn.delay(300)}>
          <Pressable 
            style={[styles.confirmButton, !isComplete && styles.confirmDisabled]} 
            onPress={submit}
            disabled={!isComplete}
          >
            <Text style={styles.confirmText}>Confirmar</Text>
            <Ionicons name="checkmark-circle" size={20} color={isComplete ? '#000' : 'rgba(255,255,255,0.4)'} />
          </Pressable>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    maxWidth: 400,
    gap: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 60,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    height: '100%',
  },
  confirmButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  confirmDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  confirmText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#000000',
  }
});
