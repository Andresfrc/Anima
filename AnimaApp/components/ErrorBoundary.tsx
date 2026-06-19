/**
 * ErrorBoundary — Captura errores de render en el árbol de React y muestra una
 * pantalla de recuperación amable en lugar de una pantalla en blanco / crash.
 *
 * Usa colores estáticos a propósito (no depende del ThemeContext) por si el
 * error ocurre dentro del propio proveedor de tema.
 *
 * Punto de integración para reporte de errores (Sentry/Bugsnag): ver
 * `componentDidCatch`. Si defines EXPO_PUBLIC_SENTRY_DSN, aquí es donde se
 * enviaría el error.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // En producción esto queda como gancho para Sentry/Bugsnag.
    // console.error se conserva en prod (ver utils/silenceLogs).
    console.error('[ErrorBoundary] Error capturado:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.title}>Algo no salió como esperábamos</Text>
          <Text style={styles.subtitle}>
            Tranquilo/a, tus datos están a salvo. Vuelve a intentarlo.
          </Text>
          <Pressable
            style={styles.button}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#E8F4FD',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#5B9BD5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
