import { Audio } from 'expo-av';

// Map of sound names to require() paths
// We use a map but will wrap access in try/catch in case files don't exist
const SOUND_FILES: Record<string, any> = {
  // Uncomment when files are added:
  // click: require('../assets/sounds/click.mp3'),
  // success: require('../assets/sounds/success.mp3'),
  // breathe_in: require('../assets/sounds/breathe_in.mp3'),
  // breathe_out: require('../assets/sounds/breathe_out.mp3'),
  pop: require('../assets/sounds/pop.mp3'),
  // Ambient
  rain: require('../assets/sounds/rain.mp3'),
  ocean: require('../assets/sounds/ocean.mp3'),
  fire: require('../assets/sounds/fire.mp3'),
  birds: require('../assets/sounds/birds.mp3'),
};

type SoundName = keyof typeof SOUND_FILES;

class SoundManager {
  private sounds: Record<string, Audio.Sound> = {};
  
  // Ambient State
  private currentAmbient: Audio.Sound | null = null;
  private currentAmbientName: string | null = null;
  
  // Concurrency Control
  private pendingAmbient: string | null = null;
  private isProcessingAmbient = false;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Ensure speaker output
        staysActiveInBackground: true,
      });
    } catch (e) {
      console.warn('Failed to init audio', e);
    }
  }

  // Fire and forget sound effects (non-looping)
  async play(name: string) {
    try {
      const source = SOUND_FILES[name];
      if (!source) return; 

      const { sound } = await Audio.Sound.createAsync(source);
      const key = `${name}_${Date.now()}`;
      this.sounds[key] = sound;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          delete this.sounds[key];
        }
      });

      await sound.playAsync();
    } catch (error) {
      // Graceful failure if asset is missing or errored
    }
  }

  // Robust Ambient Player (Handles rapid switching)
  async playAmbient(name: string) {
    // 1. Set the desired state
    this.pendingAmbient = name;

    // 2. If already a loop running, let it pick up the new state
    if (this.isProcessingAmbient) return;

    // 3. Start the loop
    this.isProcessingAmbient = true;

    try {
      // Keep processing until actual matches pending
      while (this.currentAmbientName !== this.pendingAmbient) {
        const target: string | null = this.pendingAmbient;
        
        // A. Unload current if exists
        if (this.currentAmbient) {
          try {
            await this.currentAmbient.stopAsync();
            await this.currentAmbient.unloadAsync();
          } catch(e) { console.warn('Error unloading ambient', e); }
          this.currentAmbient = null;
          this.currentAmbientName = null;
        }

        // B. If target is 'off' or null, we are done (already unloaded above)
        if (!target || target === 'off') {
          this.currentAmbientName = 'off'; // Mark as handled
          continue; 
        }

        // C. Load new sound
        const source = SOUND_FILES[target];
        if (source) {
          try {
            const { sound } = await Audio.Sound.createAsync(source, { isLooping: true });
            // Check if request changed while loading
            if (this.pendingAmbient !== target) {
              await sound.unloadAsync();
              continue; // Loop again to handle new target
            }
            
            this.currentAmbient = sound;
            this.currentAmbientName = target;
            await sound.playAsync();
          } catch (e) {
            console.warn(`Failed to play ambient: ${target}`, e);
            // If failed, mark as handled so we don't infinite loop unless changed
             if (this.pendingAmbient === target) {
                 this.pendingAmbient = 'off'; // Fallback to off
             }
          }
        } else {
             // Invalid source
             this.currentAmbientName = target; // Pretend we handled it
        }
      }
    } finally {
      this.isProcessingAmbient = false;
    }
  }

  async stopAmbient() {
    await this.playAmbient('off');
  }

  async unloadAll() {
    // Stop ambient
    await this.stopAmbient();
    
    // Unload SFX
    for (const key in this.sounds) {
      try {
        await this.sounds[key].unloadAsync();
      } catch (e) {}
    }
    this.sounds = {};
  }
}

export const SoundService = new SoundManager();
