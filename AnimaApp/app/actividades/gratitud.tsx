import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows } from '../../constants/theme';
import { GlassCard, JewelButton } from '../../components/ui';
import { useStore, JournalEntry } from '../../store/useStore';
import { SoundService } from '../../utils/SoundService';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase'; // ← único import nuevo

// ============ Draggable Star Component ============
interface FloatingStarProps {
  entry: JournalEntry;
  index: number;
  containerWidth: number;
  containerHeight: number;
  onLongPress: (entry: JournalEntry) => void;
}

function FloatingStar({ entry, index, containerWidth, containerHeight, onLongPress }: FloatingStarProps) {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const scale = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 8, stiffness: 100, mass: 0.8 })
    );
    rotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(glowOpacity);
      cancelAnimation(scale);
    };
  }, []);

  const clampX = containerWidth ? containerWidth / 2 - 30 : 100;
  const clampY = containerHeight ? containerHeight / 2 - 30 : 100;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = Math.max(-clampX, Math.min(clampX, contextX.value + event.translationX));
      translateY.value = Math.max(-clampY, Math.min(clampY, contextY.value + event.translationY));
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value, { damping: 20 });
      translateY.value = withSpring(translateY.value, { damping: 20 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (labelOpacity.value > 0.5) {
        labelOpacity.value = withTiming(0, { duration: 200 });
      } else {
        labelOpacity.value = withTiming(1, { duration: 200 });
        labelOpacity.value = withDelay(3000, withTiming(0, { duration: 300 }));
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: entry.x + translateX.value },
      { translateY: entry.y + translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const labelAnimStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ scale: interpolate(labelOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.starContainer, animatedStarStyle]}>
        <Animated.View style={[styles.starGlow, glowAnimStyle]} />
        <Pressable
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPress(entry);
          }}
          onPressIn={() => { scale.value = withSpring(1.2); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          delayLongPress={500}
          style={styles.starIcon}
        >
          <Ionicons name="star" size={22} color="#FCD34D" />
        </Pressable>
        <Animated.View style={[
          styles.starLabel,
          labelAnimStyle,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          },
        ]}>
          <Text style={[styles.starLabelText, { color: colors.textPrimary }]} numberOfLines={2}>
            {entry.text}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

// ============ Entry Detail Modal ============
interface EntryModalProps {
  visible: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

function EntryDetailModal({ visible, entry, onClose, onDelete, onUpdate }: EntryModalProps) {
  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (entry) {
      setEditText(entry.text);
      setIsEditing(false);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(entry.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  const formattedDate = (() => {
    try {
      const d = new Date(entry.date);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  })();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalCenter}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: isDark ? colors.bgCard : '#FFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalStarIcon}>
                <Ionicons name="star" size={24} color="#FCD34D" />
              </View>
              <Text style={[styles.modalDate, { color: colors.textLight }]}>{formattedDate}</Text>
            </View>

            {isEditing ? (
              <TextInput
                autoFocus multiline value={editText} onChangeText={setEditText}
                style={[
                  styles.modalEditInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(91, 155, 213, 0.06)',
                    color: colors.textPrimary,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(91, 155, 213, 0.15)',
                  },
                ]}
                textAlignVertical="top"
                placeholder="Escribe algo..."
                placeholderTextColor={colors.textLight}
              />
            ) : (
              <Text style={[styles.modalText, { color: colors.textPrimary }]}>{entry.text}</Text>
            )}

            <View style={styles.modalActions}>
              {isEditing ? (
                <>
                  <Pressable
                    onPress={() => { setIsEditing(false); setEditText(entry.text); }}
                    style={[styles.modalActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(91, 155, 213, 0.08)' }]}
                  >
                    <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.modalActionText, { color: colors.textSecondary }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable onPress={handleSave} style={[styles.modalActionBtn, styles.modalSaveBtn]}>
                    <Ionicons name="checkmark-outline" size={20} color="#FFF" />
                    <Text style={[styles.modalActionText, { color: '#FFF' }]}>Guardar</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    style={[styles.modalActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(91, 155, 213, 0.08)' }]}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalActionText, { color: colors.primary }]}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={handleDelete} style={[styles.modalActionBtn, styles.modalDeleteBtn]}>
                    <Ionicons name="trash-outline" size={20} color="#E53E3E" />
                    <Text style={[styles.modalActionText, { color: '#E53E3E' }]}>Eliminar</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ============ Main Screen ============
export default function GratitudeJournalScreen() {
  const { colors, isDark } = useTheme();
  const journalEntries = useStore((s) => s.journalEntries) ?? [];
  const addJournalEntry = useStore((s) => s.addJournalEntry);
  const removeJournalEntry = useStore((s) => s.removeJournalEntry);
  const updateJournalEntry = useStore((s) => s.updateJournalEntry);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [skySize, setSkySize] = useState({ width: 0, height: 0 });
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);

  // ── Cargar entradas desde Supabase al montar ──────────────────────────────
  useEffect(() => {
    const loadEntries = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, text, x, y, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const mapped: JournalEntry[] = data.map((row) => ({
        id:   row.id,
        text: row.text,
        x:    row.x,
        y:    row.y,
        date: row.created_at,
      }));

      // Solo sincroniza si Supabase tiene más datos que el store local
      if (mapped.length > 0) {
        useStore.setState({ journalEntries: mapped });
      }
    };

    loadEntries();
  }, []);

  // ── Agregar entrada — guarda en store y en Supabase ───────────────────────
  const handleAddItem = async () => {
    if (!inputText.trim()) return;

    const newItem: JournalEntry = {
      id:   Date.now().toString(),
      text: inputText.trim(),
      x:    Math.random() * 80 - 40,
      y:    Math.random() * 60 - 30,
      date: new Date().toISOString(),
    };

    SoundService.play('pop');
    addJournalEntry(newItem); // guarda en store local
    setInputText('');
    setShowXPGain(true);
    setTimeout(() => {
      setShowXPGain(false);
      setShowInput(false);
    }, 1200);

    // Guardar en Supabase en paralelo — no bloquea la UI
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('journal_entries').insert({
        id:      newItem.id,
        user_id: user.id,
        text:    newItem.text,
        x:       newItem.x,
        y:       newItem.y,
      });
    }
  };

  // ── Eliminar entrada — borra en store y en Supabase ───────────────────────
  const handleDelete = async (id: string) => {
    removeJournalEntry(id); // borra del store local

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id);
    }
  };

  // ── Actualizar entrada — edita en store y en Supabase ────────────────────
  const handleUpdate = async (id: string, text: string) => {
    updateJournalEntry(id, text); // edita en store local

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('journal_entries')
        .update({ text, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
    }
  };

  const handleLongPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const handleSkyLayout = (e: LayoutChangeEvent) => {
    setSkySize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  };

  return (
    <ScreenWrapper style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <View style={[
                styles.backBtnInner,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}>
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </View>
            </Pressable>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Diario Estelar</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(600).delay(200)}
            style={[
              styles.skyContainer,
              { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(91, 155, 213, 0.2)' },
            ]}
            onLayout={handleSkyLayout}
          >
            <LinearGradient
              colors={isDark
                ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']
                : ['rgba(91, 155, 213, 0.06)', 'rgba(168, 230, 207, 0.06)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.cornerDecor1}>
              <Ionicons name="sparkles-outline" size={16} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(91, 155, 213, 0.15)'} />
            </View>
            <View style={styles.cornerDecor2}>
              <Ionicons name="sparkles-outline" size={14} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(168, 230, 207, 0.15)'} />
            </View>

            {journalEntries.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={40} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(91, 155, 213, 0.2)'} />
                <Text style={[styles.emptyStateTitle, { color: colors.textLight }]}>Tu cielo está vacío...</Text>
                <Text style={[styles.emptyStateSubtitle, { color: colors.textLight }]}>
                  Agrega lo que te hace sentir agradecido y llena tu cielo de estrellas ✨
                </Text>
              </View>
            )}

            {journalEntries.map((entry, idx) => (
              <FloatingStar
                key={entry.id} entry={entry} index={idx}
                containerWidth={skySize.width} containerHeight={skySize.height}
                onLongPress={handleLongPress}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.inputArea}>
            {!showInput ? (
              <JewelButton title="Crear nueva estrella" icon="star-outline" onPress={() => setShowInput(true)} />
            ) : (
              <Animated.View entering={FadeInUp.duration(300)}>
                <GlassCard style={styles.inputCard}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>¿Por qué estás agradecido hoy?</Text>
                  <TextInput
                    autoFocus multiline value={inputText} onChangeText={setInputText}
                    placeholder="Ej: Un café caliente, la sonrisa de un amigo..."
                    placeholderTextColor={colors.textLight}
                    style={[
                      styles.textInput,
                      {
                        color: colors.textPrimary,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(91, 155, 213, 0.06)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(91, 155, 213, 0.15)',
                      },
                    ]}
                    textAlignVertical="top"
                  />
                  <View style={styles.inputButtons}>
                    <Pressable
                      onPress={() => { setShowInput(false); setInputText(''); }}
                      style={[styles.cancelBtn, { borderColor: colors.primary }]}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancelar</Text>
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      {showXPGain ? (
                        <Animated.View entering={FadeIn.duration(300)} style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                          backgroundColor: 'rgba(252, 211, 77, 0.15)',
                          paddingVertical: 14, borderRadius: 16,
                        }}>
                          <Ionicons name="sparkles" size={18} color="#FCD34D" />
                          <Text style={{ color: '#FCD34D', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>+15 XP</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_500Medium' }}>¡Estrella creada!</Text>
                        </Animated.View>
                      ) : (
                        <JewelButton title="Enviar" icon="sparkles-outline" onPress={handleAddItem} disabled={!inputText.trim()} />
                      )}
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            )}
          </Animated.View>

          <View style={{ height: 20 }} />
        </KeyboardAvoidingView>

        <EntryDetailModal
          visible={modalVisible}
          entry={selectedEntry}
          onClose={() => setModalVisible(false)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </GestureHandlerRootView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backBtnInner: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  skyContainer: {
    flex: 1, marginHorizontal: 20, marginBottom: 16, borderRadius: 24,
    borderWidth: 2, borderStyle: 'dashed',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  cornerDecor1: { position: 'absolute', top: 12, right: 12, opacity: 0.6 },
  cornerDecor2: { position: 'absolute', bottom: 12, left: 12, opacity: 0.6 },
  emptyState: { alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyStateTitle: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', fontFamily: 'Poppins_500Medium' },
  emptyStateSubtitle: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
  starContainer: { position: 'absolute', alignItems: 'center', gap: 4, zIndex: 10 },
  starGlow: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(252, 211, 77, 0.25)', top: -10,
  },
  starIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(252, 211, 77, 0.25)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.3)', shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  starLabel: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, maxWidth: 140, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  starLabelText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  inputArea: { paddingHorizontal: 20, paddingBottom: 10 },
  inputCard: { padding: 16, gap: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  textInput: { borderRadius: 14, padding: 14, fontSize: 15, height: 90, borderWidth: 1 },
  inputButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCenter: { width: '100%', alignItems: 'center' },
  modalCard: {
    width: '85%', maxWidth: 360, borderRadius: 24, padding: 24, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  modalHeader: { alignItems: 'center', gap: 8 },
  modalStarIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(252, 211, 77, 0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(252, 211, 77, 0.3)',
  },
  modalDate: { fontSize: 12 },
  modalText: { fontSize: 16, lineHeight: 24, textAlign: 'center', fontFamily: 'Poppins_500Medium' },
  modalEditInput: { borderRadius: 14, padding: 14, fontSize: 15, minHeight: 80, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 14,
  },
  modalActionText: { fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { backgroundColor: Colors.primary },
  modalDeleteBtn: { backgroundColor: 'rgba(229, 62, 62, 0.08)' },
});