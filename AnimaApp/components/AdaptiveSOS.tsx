import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { EMOTIONAL_ROUTES } from '../constants/clinicalContent';
import { Gradients } from '../constants/theme';
import { BlurView } from 'expo-blur';
import { GlassCard, JewelButton } from './ui';

const { width, height } = Dimensions.get('window');

export function AdaptiveSOSButton() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentPlan = useStore(s => s.currentPlan);
  const [modalVisible, setModalVisible] = useState(false);

  const routeColor = EMOTIONAL_ROUTES.find(r => r.id === currentPlan)?.color || colors.primary;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setModalVisible(true);
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  };

  // Render the specific SOS content based on the current plan
  const renderSOSContent = () => {
    switch (currentPlan) {
      case 'ansiedad':
      case 'balance':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Respiración Calmante</Text>
            <Text style={[styles.modalMotivation, { color: colors.textLight }]}>
              No tienes que resolver todo hoy. <Text style={{ color: routeColor, textDecorationLine: 'underline' }}>Solo respira</Text>.
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, marginBottom: 24 }]}>
              Vamos a calmar tu sistema nervioso juntos. Entraremos a tu espacio seguro de respiración.
            </Text>
            <JewelButton 
              title="Iniciar Respiración" 
              icon="leaf-outline" 
              colors={[routeColor, Gradients.jewel[1]]} 
              onPress={() => { closeModal(); router.push('/actividades/respiracion'); }} 
            />
          </View>
        );
      case 'autocompasion':
      case 'inseguridad':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Línea de Vida</Text>
            <Text style={[styles.modalMotivation, { color: colors.textLight }]}>
              Mereces <Text style={{ color: routeColor, textDecorationLine: 'underline' }}>la misma bondad</Text> que le das a otros.
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, marginBottom: 20 }]}>
              Recuerda, esta voz crítica no eres tú. Mira lo lejos que has llegado:
            </Text>
            <View style={[styles.messageCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="heart" size={20} color={routeColor} style={{alignSelf: 'center', marginBottom: 8}} />
              <Text style={[styles.messageText, { color: colors.textPrimary }]}>"Has sobrevivido al 100% de tus días más oscuros. Hoy no será la excepción."</Text>
            </View>
            <JewelButton 
              title="¡Puedo con esto!" 
              icon="checkmark-circle-outline" 
              style={{ marginTop: 24 }}
              colors={[routeColor, Gradients.jewel[1]]} 
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); closeModal(); }} 
            />
          </View>
        );
      case 'soledad':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Rompehielos Seguro</Text>
            <Text style={[styles.modalMotivation, { color: colors.textLight }]}>
              Pedir ayuda también es <Text style={{ color: routeColor, textDecorationLine: 'underline' }}>un acto de valentía</Text>.
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, marginBottom: 20 }]}>
              Toca para copiar un mensaje y enviárselo a alguien en quien confíes:
            </Text>
            <Pressable 
              style={[styles.messageBox, { borderColor: routeColor }]}
              onPress={() => handleCopy("Hola, la verdad no me he sentido muy bien últimamente. ¿Tendrías 5 minutitos hoy para platicar?")}
            >
              <Text style={[styles.messageText, { color: colors.textPrimary, flex: 1 }]}>"Hola, la verdad no me he sentido muy bien últimamente. ¿Tendrías 5 minutitos hoy para platicar?"</Text>
              <Ionicons name="copy-outline" size={20} color={routeColor} style={styles.copyIcon} />
            </Pressable>
            <Pressable 
              style={[styles.messageBox, { borderColor: routeColor }]}
              onPress={() => handleCopy("Hola, un abrazo y espero que estés bien. Solo pasaba a saludarte y pedir un poco de compañía.")}
            >
              <Text style={[styles.messageText, { color: colors.textPrimary, flex: 1 }]}>"Hola, un abrazo... Solo pasaba a pedirte un poco de compañía."</Text>
              <Ionicons name="copy-outline" size={20} color={routeColor} style={styles.copyIcon} />
            </Pressable>
          </View>
        );
      case 'renacer':
      case 'depresion':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Victoria Microscópica</Text>
            <Text style={[styles.modalMotivation, { color: colors.textLight }]}>
              Un pequeño paso es mejor que <Text style={{ color: routeColor, textDecorationLine: 'underline' }}>ningún paso</Text>.
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, marginBottom: 24 }]}>
              La motivación llega después de la acción. Tu único reto en este preciso momento es:
            </Text>
            <Text style={[styles.bigTask, { color: routeColor }]}>Beber medio vaso de agua fría 💧</Text>
            <JewelButton 
              title="¡Reto Completado!" 
              icon="trophy-outline" 
              style={{ marginTop: 32 }}
              colors={[routeColor, Gradients.jewel[1]]} 
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); closeModal(); }} 
            />
          </View>
        );
      case 'descubrimiento':
      default:
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ancla Visual</Text>
            <Text style={[styles.modalMotivation, { color: colors.textLight }]}>
              Solo el <Text style={{ color: routeColor, textDecorationLine: 'underline' }}>aquí y ahora</Text> es real.
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, marginBottom: 20 }]}>
              Tu mente está intentando predecir el futuro. Oblígala a volver al presente físico:
            </Text>
            <View style={[styles.anclaRow, { backgroundColor: routeColor + '20' }]}>
              <Text style={[styles.anclaText, { color: colors.textPrimary }]}>Encuentra y toca <Text style={{fontWeight: '900', color: routeColor}}>3 COSAS CON COLOR</Text> a tu alrededor en la vida real.</Text>
            </View>
            <JewelButton 
              title="Volví al presente" 
              icon="eye-outline" 
              style={{ marginTop: 24 }}
              colors={[routeColor, Gradients.jewel[1]]} 
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); closeModal(); }} 
            />
          </View>
        );
    }
  };

  return (
    <>
      <Pressable 
        style={({ pressed }) => [
          styles.sosButton,
          { backgroundColor: routeColor, shadowColor: routeColor },
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 }
        ]}
        onPress={handlePress}
      >
        <Ionicons name="medical" size={28} color="#FFF" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
          <BlurView intensity={isDark ? 80 : 40} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
        </Animated.View>

        <Animated.View 
          entering={SlideInDown.duration(600).easing(Easing.out(Easing.exp))} 
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          style={styles.modalContainer}
        >
          <GlassCard style={{ ...styles.modalCard as object, backgroundColor: colors.bgCard }}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconWrap, { backgroundColor: routeColor + '20' }]}>
                  <Ionicons name="medical" size={24} color={routeColor} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  SOS
                </Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={32} color={colors.textLight} />
              </Pressable>
            </View>
            
            {renderSOSContent()}

            {/* ── Crisis Lines (always visible) ── */}
            <View style={[styles.crisisSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[styles.crisisTitle, { color: colors.textLight }]}>Si necesitas ayuda profesional ahora</Text>
              
              <Pressable
                style={[styles.crisisLine, { backgroundColor: '#EF4444' + '12' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); Linking.openURL('tel:106'); }}
              >
                <View style={[styles.crisisIconWrap, { backgroundColor: '#EF4444' + '20' }]}>
                  <Ionicons name="call" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.crisisName, { color: colors.textPrimary }]}>Línea 106</Text>
                  <Text style={[styles.crisisDesc, { color: colors.textLight }]}>Salud mental • Gratuita • 24/7</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#EF4444" />
              </Pressable>

              <Pressable
                style={[styles.crisisLine, { backgroundColor: colors.primary + '08' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Linking.openURL('tel:123'); }}
              >
                <View style={[styles.crisisIconWrap, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.crisisName, { color: colors.textPrimary }]}>Línea 123</Text>
                  <Text style={[styles.crisisDesc, { color: colors.textLight }]}>Emergencias • Nacional</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>

              <Text style={[styles.crisisNote, { color: colors.textLight }]}>
                Aníma no reemplaza atención profesional. Si estás en peligro, llama ahora.
              </Text>
            </View>

          </GlassCard>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    bottom: 110, // Safely above the 96px tab bar
    right: 24,   // Aligned with the tab bar margin
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  modalCard: {
    padding: 24,
    minHeight: 380,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 12,
    width: '100%',
  },
  modalMotivation: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    width: '100%',
  },
  modalDesc: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  // Route Specific Styles
  messageCard: {
    padding: 16, borderRadius: 16, width: '100%',
  },
  messageText: {
    fontSize: 14, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', textAlign: 'center', lineHeight: 22,
  },
  messageBox: {
    width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  copyIcon: {
    marginLeft: 12,
  },
  bigTask: {
    fontSize: 20, fontFamily: 'Poppins_700Bold', textAlign: 'center',
  },
  anclaRow: {
    padding: 16, borderRadius: 16, width: '100%',
  },
  anclaText: {
    fontSize: 16, fontFamily: 'Poppins_500Medium', textAlign: 'center', lineHeight: 24,
  },
  // Crisis lines
  crisisSection: {
    width: '100%', borderTopWidth: 1, marginTop: 20, paddingTop: 16,
  },
  crisisTitle: {
    fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12, textAlign: 'center',
  },
  crisisLine: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, marginBottom: 8,
  },
  crisisIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  crisisName: {
    fontSize: 14, fontWeight: '700', fontFamily: 'Poppins_700Bold',
  },
  crisisDesc: {
    fontSize: 11, fontFamily: 'Poppins_400Regular',
  },
  crisisNote: {
    fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center',
    marginTop: 8, fontStyle: 'italic', lineHeight: 14,
  },
});
