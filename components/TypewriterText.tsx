import React, { useState, useEffect, useRef } from 'react';
import { SYSTEM_CONFIG } from '../constants';

interface TypewriterTextProps {
  text: string;
  start?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, start = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // If not allowed to start, just reset/keep empty and return
    if (!start) {
      setDisplayedText('');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset when text changes (implied by dependency array) or when start becomes true
    setDisplayedText('');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!text) return;

    timerRef.current = window.setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          const char = text.charAt(prev.length);
          return prev + char;
        }
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        return prev;
      });
    }, SYSTEM_CONFIG.ui.typingSpeed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [text, start]);

  return (
    <span>{displayedText}</span>
  );
};

export default TypewriterText;
