import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}>
      {/* triage debe ir registrado y PRIMERO: es la entrada del onboarding.
          Sin esto, navegar a /(onboarding)/triage caía a select-plan y se
          saltaba el cuestionario. */}
      <Stack.Screen name="triage" />
      <Stack.Screen name="select-plan" />
    </Stack>
  );
}
