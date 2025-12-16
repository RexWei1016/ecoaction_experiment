import { SYSTEM_CONFIG } from '../constants';

// Simple wrapper around browser's SpeechSynthesis API
// In a full production version, this would fetch audio blobs from the backend.

// Keep a global reference to active utterances to prevent garbage collection on Safari/iOS
const activeUtterances: SpeechSynthesisUtterance[] = [];

export const speakText = (text: string, onEnd?: () => void) => {
  if (!window.speechSynthesis) {
    console.warn("Browser does not support SpeechSynthesis");
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech to prevent overlapping
  window.speechSynthesis.cancel();

  // Detect iOS early
  // @ts-ignore
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Add to global array to prevent GC
  activeUtterances.push(utterance);
  
  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Filter for Chinese voices (Traditional or Simplified)
    const zhVoices = voices.filter(v => 
      v.lang.toLowerCase().includes('zh')
    );

    let targetVoice: SpeechSynthesisVoice | undefined;

    // Use configuration from constants
    const preferredGender = SYSTEM_CONFIG.tts.gender;

    if (preferredGender === 'MALE') {
        // Strategy: Try to find a voice that fits "Allen" (Male)
        targetVoice = zhVoices.find(v => 
          v.name.includes('Male') || 
          v.name.includes('Zhiwei') || // Microsoft Windows - Traditional Chinese Male
          v.name.includes('Kangkang') || // Microsoft Windows - Simplified Chinese Male
          v.name.includes('Danny') ||      // Sometimes multilingual male
          v.name.includes('Sin-ji') ||     // iOS Traditional Chinese Male
          v.name.includes('Li-Mu') ||      // iOS Simplified Chinese Male (Siri)
          (isIOS && v.name.includes('Siri')) // Fallback for iOS: Any Siri voice
        );
    } else {
        // Strategy: Try to find Female voices
        targetVoice = zhVoices.find(v => 
          v.name.includes('Female') || 
          v.name.includes('Hsiao') || 
          v.name.includes('Yaoyao') ||
          v.name.includes('Huihui') ||
          v.name.includes('Meijia') || // iOS Traditional Chinese
          v.name.includes('Google') || // Google voices are often female by default
          (isIOS && v.name.includes('Siri')) // Fallback for iOS: Any Siri voice
        );
    }

    // Fallback: If preferred gender not found, try high quality Google voices
    if (!targetVoice) {
      targetVoice = zhVoices.find(v => v.name.includes('Google'));
    }

    // Final Fallback: Any Chinese voice
    if (!targetVoice) {
      targetVoice = zhVoices[0];
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    }

    // Adjust for more natural conversation based on config
    const isMale = SYSTEM_CONFIG.tts.gender === 'MALE';

    if (isIOS) {
      // iOS Web Speech API Stability Settings
      // We do NOT set rate/pitch for iOS to ensure stability.
      // Only set default lang if no voice was selected
      if (!utterance.voice) {
         utterance.lang = 'zh-TW';
      }
    } else {
      utterance.rate = isMale ? SYSTEM_CONFIG.tts.rateMale : SYSTEM_CONFIG.tts.rateFemale;
      utterance.pitch = SYSTEM_CONFIG.tts.pitch;
    }
    
    utterance.volume = 1.0;

    // Some browsers throw exception if spoken without user gesture interaction first
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("SpeechSynthesis speak error:", err);
      if (onEnd) onEnd();
    }
  };

  utterance.onend = () => {
    // Remove from global array
    const index = activeUtterances.indexOf(utterance);
    if (index > -1) activeUtterances.splice(index, 1);
    
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    // Remove from global array
    const index = activeUtterances.indexOf(utterance);
    if (index > -1) activeUtterances.splice(index, 1);

    // Ignore interruption errors which happen frequently when skipping steps
    if (e.error === 'canceled' || e.error === 'interrupted') {
      return;
    }
    
    if (e.error === 'not-allowed') {
      console.error("TTS Error: Autoplay not allowed. User interaction required.");
    } else {
      console.error("TTS Error:", e.error);
    }
    
    // Always call onEnd to ensure UI state (isSpeaking) is reset
    if (onEnd) onEnd();
  };

  // If voices are already loaded, speak immediately. Otherwise wait.
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak();
      // Remove handler to avoid re-triggering
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
};

// iOS Safari Hack: Global resume interval REMOVED
// The previous interval hack was likely causing the "choppy/broken" audio on iOS.
// We rely on the 'activeUtterances' GC fix instead.

export const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};