import { SYSTEM_CONFIG } from '../constants';

const TTS_API_URL = 'http://192.168.0.2:8000/tts'; // Update this with your deployed URL

let currentAudio: HTMLAudioElement | null = null;

export const stopCustomSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

export const playCustomTTS = async (
  text: string, 
  options: { speed?: number; gender?: 'male' | 'female'; engine?: 'auto' | 'local' | 'gtts' | 'gemini' } = {},
  onEnd?: () => void
) => {
  // Stop any previous speech
  stopCustomSpeech();

  // Determine effective speed (default to 1.0 if not specified)
  const speed = options.speed ?? 1.0;
  const gender = options.gender ?? 'male';
  const engine = options.engine ?? 'gemini';

  try {
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        speaker_id: 0, 
        speed: speed,
        gender: gender,
        engine: engine,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API Error: ${response.statusText}`);
    }

    // Get the audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Apply playback rate on the client side
    audio.playbackRate = speed;
    // Optional: preserve pitch when changing speed (default is true usually, but good to be explicit if needed)
    // audio.preservesPitch = true; 

    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Cleanup
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.error("Audio playback error", e);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (onEnd) onEnd();
    };

    await audio.play();

  } catch (error) {
    console.error("Failed to play custom TTS (Backend), falling back to Browser Native TTS:", error);
    
    // Fallback: Use Browser Native TTS (window.speechSynthesis)
    // This ensures that even if the backend is down or rate-limited, the user still hears speech.
    
    if ('speechSynthesis' in window) {
      // Cancel any current browser speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to match language
      utterance.lang = 'zh-TW';
      
      // Attempt to match speed (Note: browser rate scale might differ slightly from backend)
      utterance.rate = speed; 

      // Attempt to select a voice based on gender preference (heuristic)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes('zh') && 
        (gender === 'female' ? v.name.includes('Female') || v.name.includes('女') : v.name.includes('Male') || v.name.includes('男'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.error("Browser TTS failed:", e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Browser does not support TTS.");
      if (onEnd) onEnd();
    }
  }
};
