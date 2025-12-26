import React, { useState, useEffect, useRef, useCallback } from 'react';

import Layout from './components/Layout';
import AllenAvatar from './components/AllenAvatar';
import TypewriterText from './components/TypewriterText';
import VideoPlayer from './components/VideoPlayer';

import { 
  StepId, 
  UserData, 
  INITIAL_USER_DATA, 
  ActionCategory 
} from './types';

import { 
  SCRIPTS, 
  QUIZ_OPTIONS, 
  COMMITMENT_QUESTIONS, 
  SELF_IDENTITY_QUESTIONS,
  PRE_RECORDED_AUDIO,
  VIDEO_URL
} from './constants';

// Use Custom TTS for generation capability (async loading)
import { playCustomTTS as speakText, playAudioUrl, stopCustomSpeech as stopSpeech } from './services/customTtsService';

// API for data submission
import { sendToGAS } from './api/sendToGAS';

// Step order definition
const STEP_SEQUENCE = [
  StepId.STEP_00_INTRO,
  StepId.STEP_01_GREETING,
  StepId.STEP_02_VIDEO_INTRO,
  StepId.STEP_03_VIDEO_QUIZ,
  StepId.STEP_04_SUSTAINABILITY_PRIME,
  StepId.STEP_05_ACTION_OPEN,
  StepId.STEP_06_ACTION_FEEDBACK, // Included
  StepId.STEP_07_BEHAVIOR_PLAN,
  StepId.STEP_08_COMMITMENT_SCALE,
  StepId.STEP_09_ORG_INTRO,
  StepId.STEP_10_ORG_FEEDBACK,
  StepId.STEP_11_SELF_IDENTITY_SCALE,
  StepId.STEP_12_DONATION,
  StepId.STEP_13_END,
];

const FINAL_FORM_URL = 'https://forms.gle/C37hgKpWPdv4zStJ6';

const App: React.FC = () => {
  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false); // Track TTS generation
  const [isTextVisible, setIsTextVisible] = useState(false); // Control text appearance sync
  const [isLoading, setIsLoading] = useState(false); // General loading (e.g. API)
  const [inputValue, setInputValue] = useState('');
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [shouldStartVideo, setShouldStartVideo] = useState(false);
  const hasUnlockedAudioRef = useRef(false);
  const hasSentDataRef = useRef(false); // Prevent duplicate submission
  
  // Refs
  const currentStepId = STEP_SEQUENCE[currentStepIndex];
  const currentScript = SCRIPTS[currentStepId];
  const bottomRef = useRef<HTMLDivElement>(null);

  const unlockAudio = useCallback(async () => {
    if (hasUnlockedAudioRef.current) return;
    hasUnlockedAudioRef.current = true;

    try {
      // Many browsers (especially mobile Safari/Chrome) block autoplay until audio is
      // "unlocked" by a direct user gesture. We play a near-silent buffer once.
      const AudioContextCtor = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      await ctx.resume();

      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.stop(0.01);
    } catch (e) {
      console.warn('Audio unlock failed', e);
    }
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // TTS Handler
  const playScript = useCallback(async (text: string) => {
    setIsTTSLoading(true);
    setIsSpeaking(true);

    try {
      await speakText(text, {}, () => {
        setIsSpeaking(false);
      });
      setIsTextVisible(true);
    } catch (e) {
      console.error('TTS Error', e);
      setIsSpeaking(false);
      setIsTextVisible(true);
    } finally {
      setIsTTSLoading(false);
    }
  }, []);

  const playPreRecorded = useCallback(async (audioUrl: string) => {
    setIsTTSLoading(false);
    setIsSpeaking(true);

    try {
      await playAudioUrl(audioUrl, () => {
        setIsSpeaking(false);
      });
      setIsTextVisible(true);
    } catch (e) {
      console.error('Audio Error', e);
      setIsSpeaking(false);
      setIsTextVisible(true);
    }
  }, []);

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Effect: Play script when step changes
  useEffect(() => {
    if (!hasStarted) return; // Prevent auto-play before user interaction

    stopSpeech();
    setInputValue(''); // Reset input on step change
    setIsVideoFinished(false); // Reset video state
    setShouldStartVideo(false); // Reset video start state
    
    // Determine the actual text to display/speak
    let textToPlay = currentScript.script;
    let audioUrlToPlay: string | undefined = currentScript.audioUrl;

    // Replace Name Placeholder
    if (textToPlay.includes('{{name}}') || textToPlay.includes('{{NAME}}')) {
       // Handle both cases just in case
       textToPlay = textToPlay.replace(/{{NAME}}/gi, userData.name || '同學');
    }

    // Step 4: Quiz feedback (pick matching pre-recorded audio)
    if (currentStepId === StepId.STEP_04_SUSTAINABILITY_PRIME) {
      if (userData.quizAnswer !== 'A') {
        textToPlay = textToPlay.replace('沒錯，', '其實影片主要是在談論永續議題喔。不過沒關係，正如影片所提到的，');
        audioUrlToPlay = PRE_RECORDED_AUDIO.STEP_04_PRIME_WRONG;
      } else {
        audioUrlToPlay = PRE_RECORDED_AUDIO.STEP_04_PRIME_CORRECT;
      }
    }

    // Step 8: Branching intro based on (action none) vs (behavior plan answered)
    if (currentStepId === StepId.STEP_08_COMMITMENT_SCALE) {
      const hasBehaviorPlan = (userData.behaviorPlan || '').trim().length > 0;
      if (userData.actionCategory === 'NONE') {
        textToPlay = '接下來有個簡單的測驗想請你回答。';
        audioUrlToPlay = PRE_RECORDED_AUDIO.STEP_08_SCALE_AFTER_NONE;
      } else if (hasBehaviorPlan) {
        textToPlay = '很棒，你真的是一個永續人，謝謝你的用心。接下來有個簡單的測驗想請你回答。';
        audioUrlToPlay = PRE_RECORDED_AUDIO.STEP_08_SCALE_AFTER_YES_ANSWERED;
      } else {
        textToPlay = '那也沒關係，原本我跟你說的那些永續行動方法我覺得你一定也可以在生活中嘗試看看，我相信你一定可以成為一個永續人的。接下來有個簡單的測驗想請你回答。';
        audioUrlToPlay = PRE_RECORDED_AUDIO.STEP_08_SCALE_AFTER_YES_EMPTY;
      }
    }

    if (textToPlay) {
      const timer = setTimeout(() => {
        // Special case: Only the name chanting uses live TTS.
        if (currentStepId === StepId.STEP_02_VIDEO_INTRO) {
          const name = (userData.name || '同學').trim() || '同學';
          const nameChant = `${name}你好`;
          setIsSpeaking(true);
          setIsTTSLoading(true);

          speakText(nameChant, { engine: 'local' }, () => {
            setIsTTSLoading(false);
            if (audioUrlToPlay) {
              // 播放第二段音頻，並在其 onEnd 回調中開始影片
              playAudioUrl(audioUrlToPlay, () => {
                setIsSpeaking(false);
                // 確保在第二段語音播放完畢後才開始影片
                setShouldStartVideo(true);
              }).catch((e) => {
                console.error('Audio Error', e);
                setIsSpeaking(false);
                setShouldStartVideo(true);
              });
            } else {
              setIsSpeaking(false);
              setShouldStartVideo(true);
            }
          }).then(() => {
            setIsTextVisible(true);
          }).catch((e) => {
            console.error('Name TTS Error', e);
            setIsTTSLoading(false);
            if (audioUrlToPlay) {
              playAudioUrl(audioUrlToPlay, () => {
                setIsSpeaking(false);
                setShouldStartVideo(true);
              }).catch(() => {
                setIsSpeaking(false);
                setShouldStartVideo(true);
              });
            } else {
              setIsSpeaking(false);
              setShouldStartVideo(true);
            }
            setIsTextVisible(true);
          });
          return;
        }

        if (audioUrlToPlay) {
          playPreRecorded(audioUrlToPlay);
        } else {
          playScript(textToPlay);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
        // If no text to play, show visible immediately
        setIsTextVisible(true);
    }
  }, [currentStepId, playScript, playPreRecorded, userData.actionCategory, userData.behaviorPlan, currentScript.script, currentScript.audioUrl, hasStarted, userData.name, userData.quizAnswer]);

  useEffect(() => {
    if (hasStarted) {
      scrollToBottom();
    }
  }, [currentStepIndex, hasStarted]);

  // Submit data to GAS when reaching STEP_13_END (only once)
  useEffect(() => {
    if (currentStepId === StepId.STEP_13_END && !hasSentDataRef.current) {
      hasSentDataRef.current = true;
      
      console.log('📤 資料已發送至 Google Sheets（no-cors 模式）');
      console.log('📦 UserData:', JSON.stringify(userData, null, 2));
      console.log('ℹ️ 使用 no-cors 模式，無法取得響應狀態');
      console.log('ℹ️ 請透過 Google Sheets 確認資料是否成功寫入');
      
      sendToGAS(userData);
    }
  }, [currentStepId, userData]);

  // Handlers
  const localClassifyUserAction = (text: string): ActionCategory => {
    const lower = text.toLowerCase();
    if (lower.match(/杯|瓶|袋|餐具|塑膠|重複/)) return 'REUSE';
    if (lower.match(/走|路|車|捷運|公車|大眾|騎/)) return 'TRANSPORT';
    return 'NONE';
  };

  // Helper: check if all questions in a scale have valid answers (1-5)
  const areAllItemsAnswered = (questions: { id: string }[]) => {
    return questions.every((q) => {
      const v = userData.commitmentAnswers[q.id];
      return typeof v === 'number' && v >= 1 && v <= 5;
    });
  };

  const handleNext = async () => {
    await unlockAudio();
    // Logic specific to steps before moving next
    if (isLoading || isSpeaking || isTTSLoading) return;

    // Extra safety check for the two likert scales: require each question to be answered 1-5
    if (currentStepId === StepId.STEP_08_COMMITMENT_SCALE) {
      if (!areAllItemsAnswered(COMMITMENT_QUESTIONS)) {
        alert('請為每一題選擇 1–5 分，才能繼續。');
        return;
      }
    }
    if (currentStepId === StepId.STEP_11_SELF_IDENTITY_SCALE) {
      if (!areAllItemsAnswered(SELF_IDENTITY_QUESTIONS)) {
        alert('請為每一題選擇 1–5 分，才能繼續。');
        return;
      }
    }

    // Special handling for Step 0 (Consent)
    if (currentStepId === StepId.STEP_00_INTRO) {
        if (!userData.participantId) {
            alert("請輸入編號或學號");
            return;
        }
        setUserData(prev => ({ ...prev, consent: true }));
    }

    // Special handling for Step 5 (Classification)
    if (currentStepId === StepId.STEP_05_ACTION_OPEN) {
      setIsLoading(true);
      setUserData(prev => ({ ...prev, actionOpenAnswer: inputValue }));
      // Use local classification instead of API
      const category = localClassifyUserAction(inputValue);
      setUserData(prev => ({ ...prev, actionCategory: category }));
      setIsLoading(false);

      // Branching:
      // - If user answered "none" -> go to Step 6 (encouragement)
      // - Otherwise -> skip Step 6 and go directly to Step 7 (follow-up question)
      const stepAdvance = category === 'NONE' ? 1 : 2;
      if (currentStepIndex < STEP_SEQUENCE.length - 1) {
        setIsTextVisible(false);
        setCurrentStepIndex(prev => prev + stepAdvance);
      }
      return;
    }

    // If we are on Step 6 (NONE path), skip Step 7 and go to the scale.
    if (currentStepId === StepId.STEP_06_ACTION_FEEDBACK) {
      if (currentStepIndex < STEP_SEQUENCE.length - 1) {
        setIsTextVisible(false);
        setCurrentStepIndex(prev => prev + 2);
      }
      return;
    }
    
    // Save other inputs
    if (currentStepId === StepId.STEP_01_GREETING) setUserData(prev => ({ ...prev, name: inputValue }));
    if (currentStepId === StepId.STEP_07_BEHAVIOR_PLAN) setUserData(prev => ({ ...prev, behaviorPlan: inputValue }));
    if (currentStepId === StepId.STEP_10_ORG_FEEDBACK) setUserData(prev => ({ ...prev, orgFeedback: inputValue }));
    if (currentStepId === StepId.STEP_12_DONATION) {
        const val = parseInt(inputValue, 10);
        if (isNaN(val) || val < 0 || val > 100) {
            alert("請輸入 0-100 之間的金額");
            return;
        }
        setUserData(prev => ({ ...prev, donationAmount: val }));
    }

    // Advance Step
    if (currentStepIndex < STEP_SEQUENCE.length - 1) {
      setIsTextVisible(false); // Reset for next step, ensure text is hidden initially
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const renderContent = () => {
    // 1. Determine Display Text
    let displayText = currentScript.script;

    // Replace Name Placeholder
    if (displayText.includes('{{name}}') || displayText.includes('{{NAME}}')) {
      displayText = displayText.replace(/{{NAME}}/gi, userData.name || '同學');
    }

    // Logic for Step 4: Quiz Feedback
    if (currentStepId === StepId.STEP_04_SUSTAINABILITY_PRIME) {
      if (userData.quizAnswer !== 'A') {
         displayText = displayText.replace('沒錯，', '其實影片主要是在談論永續議題喔。不過沒關係，正如影片所提到的，');
      }
    }

    // Step 8: Match display with the branching intro
    if (currentStepId === StepId.STEP_08_COMMITMENT_SCALE) {
      const hasBehaviorPlan = (userData.behaviorPlan || '').trim().length > 0;
      if (userData.actionCategory === 'NONE') {
        displayText = '接下來有個簡單的測驗想請你回答。';
      } else if (hasBehaviorPlan) {
        displayText = '很棒，你真的是一個永續人，謝謝你的用心。接下來有個簡單的測驗想請你回答。';
      } else {
        displayText = '那也沒關係，原本我跟你說的那些永續行動方法我覺得你一定也可以在生活中嘗試看看，我相信你一定可以成為一個永續人的。接下來有個簡單的測驗想請你回答。';
      }
    }

    // 2. Render Body
    return (
      <div className="flex flex-col gap-6">
        
        {/* Agent Speech Bubble */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative min-h-[6rem] flex items-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-t border-l border-slate-100 transform rotate-45"></div>
          <p className="text-lg text-slate-800 font-medium leading-relaxed whitespace-pre-line w-full">
            <TypewriterText text={displayText} start={isTextVisible} />
            {currentStepId === StepId.STEP_13_END && (
              <>
                {'\n'}
                <a
                  href={FINAL_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 underline font-semibold break-all"
                >
                  {FINAL_FORM_URL}
                </a>
              </>
            )}
          </p>
        </div>

        {/* Step Specific Interactions */}
        {currentStepId === StepId.STEP_00_INTRO && (
           <div className="flex flex-col gap-2">
               <label className="text-sm font-bold text-slate-700">請輸入學號</label>
               <input 
                 type="text" 
                 className="p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-slate-900 font-medium"
                 value={userData.participantId}
                 onChange={(e) => setUserData({...userData, participantId: e.target.value})}
                 placeholder="例如: D124020001"
               />
           </div>
        )}

        {currentStepId === StepId.STEP_01_GREETING && (
           <input 
             type="text" 
             className="p-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-400 outline-none w-full text-slate-900 font-medium"
             placeholder="怎麼稱呼你？(選填)"
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
           />
        )}

        {currentStepId === StepId.STEP_02_VIDEO_INTRO && (
          <VideoPlayer 
            videoId={getYouTubeId(VIDEO_URL) || 'XqC9j5qX2V8'}
            onEnded={() => setIsVideoFinished(true)}
            shouldPlay={shouldStartVideo}
          />
        )}

        {currentStepId === StepId.STEP_03_VIDEO_QUIZ && (
          <div className="grid gap-3">
            {QUIZ_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  if (isSpeaking || isTTSLoading) return; // Block input while speaking
                  unlockAudio();
                  setUserData(prev => ({...prev, quizAnswer: opt.id}));
                  setTimeout(() => handleNext(), 300); // Auto advance after selection
                }}
                disabled={isSpeaking || isTTSLoading}
                className={`p-4 rounded-xl border-2 text-left transition-all shadow-sm ${
                  userData.quizAnswer === opt.id 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' 
                    : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold'
                } ${isSpeaking || isTTSLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="mr-2 font-black">{opt.id}.</span> {opt.text}
              </button>
            ))}
          </div>
        )}

        {(currentStepId === StepId.STEP_05_ACTION_OPEN || 
          currentStepId === StepId.STEP_07_BEHAVIOR_PLAN || 
          currentStepId === StepId.STEP_10_ORG_FEEDBACK) && (
           <textarea
             className="w-full p-4 border-2 border-slate-300 rounded-xl shadow-inner focus:ring-2 focus:ring-emerald-400 outline-none min-h-[120px] text-slate-900 font-medium placeholder-slate-400"
             placeholder="請輸入你的想法..."
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
           />
        )}

        {currentStepId === StepId.STEP_08_COMMITMENT_SCALE && (
            <div className="flex flex-col gap-8 bg-white p-4 rounded-xl border border-slate-200">
            {COMMITMENT_QUESTIONS.map((q) => (
                    <div key={q.id} className="flex flex-col gap-3 pb-4 border-b border-slate-100 last:border-0">
                        <p className="font-bold text-slate-800">{q.text}</p>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-semibold text-slate-500">非常不同意</span>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <label key={val} className="flex flex-col items-center cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name={q.id} 
                                            value={val}
                                            checked={userData.commitmentAnswers[q.id] === val}
                                            onChange={() => setUserData(prev => ({
                                                ...prev, 
                                                commitmentAnswers: { ...prev.commitmentAnswers, [q.id]: val }
                                            }))}
                                            className="w-5 h-5 text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
                                        />
                                        <span className="text-xs mt-1 text-slate-600 font-medium group-hover:text-emerald-600">{val}</span>
                                    </label>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-slate-500">非常同意</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

            {currentStepId === StepId.STEP_11_SELF_IDENTITY_SCALE && (
              <div className="flex flex-col gap-8 bg-white p-4 rounded-xl border border-slate-200">
                {SELF_IDENTITY_QUESTIONS.map((q) => (
                  <div key={q.id} className="flex flex-col gap-3 pb-4 border-b border-slate-100 last:border-0">
                    <p className="font-bold text-slate-800">{q.text}</p>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-semibold text-slate-500">非常不同意</span>
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <label key={val} className="flex flex-col items-center cursor-pointer group">
                            <input 
                              type="radio" 
                              name={q.id} 
                              value={val}
                              checked={userData.commitmentAnswers[q.id] === val}
                              onChange={() => setUserData(prev => ({
                                ...prev, 
                                commitmentAnswers: { ...prev.commitmentAnswers, [q.id]: val }
                              }))}
                              className="w-5 h-5 text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
                            />
                            <span className="text-xs mt-1 text-slate-600 font-medium group-hover:text-emerald-600">{val}</span>
                          </label>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-500">非常同意</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

        {currentStepId === StepId.STEP_12_DONATION && (
            <div className="flex flex-col items-center py-6">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                    ${inputValue || 0}
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
              step="10"
                    value={inputValue || 0}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="w-full flex justify-between text-xs font-medium text-slate-500 mt-2">
                    <span>$0</span>
                    <span>$100</span>
                </div>
            </div>
        )}

        {/* 3. Navigation Controls */}
        {currentStepId !== StepId.STEP_03_VIDEO_QUIZ && currentStepId !== StepId.STEP_13_END && (
            <div className="sticky bottom-6 z-20 mt-4">
                <button
                    onClick={handleNext}
                    disabled={
                          isLoading || 
                          isSpeaking || 
                          isTTSLoading ||
                          (currentStepId === StepId.STEP_02_VIDEO_INTRO && !isVideoFinished) ||
                          (currentStepId === StepId.STEP_08_COMMITMENT_SCALE && !areAllItemsAnswered(COMMITMENT_QUESTIONS)) ||
                          (currentStepId === StepId.STEP_11_SELF_IDENTITY_SCALE && !areAllItemsAnswered(SELF_IDENTITY_QUESTIONS))
                        }
                    className={`w-full py-4 rounded-xl text-white font-bold tracking-wide shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] ${
                            (isLoading || isSpeaking || isTTSLoading || (currentStepId === StepId.STEP_02_VIDEO_INTRO && !isVideoFinished) || (currentStepId === StepId.STEP_08_COMMITMENT_SCALE && !areAllItemsAnswered(COMMITMENT_QUESTIONS)) || (currentStepId === StepId.STEP_11_SELF_IDENTITY_SCALE && !areAllItemsAnswered(SELF_IDENTITY_QUESTIONS)))
                              ? 'bg-slate-400 cursor-not-allowed' 
                              : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                >
                    {isLoading || isTTSLoading ? (
                        <span className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             {isTTSLoading ? '語音生成中...' : '處理中...'}
                        </span>
                    ) : (
                        currentScript.nextLabel || '下一步'
                    )}
                </button>
            </div>
        )}

        {currentStepId === StepId.STEP_13_END && (
             <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-800 mb-2">實驗完成</h3>
                <p className="text-emerald-600 mb-4 font-medium">請依照教室指示進行後續動作。</p>
                <a
                  href={FINAL_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mb-4 text-emerald-700 underline font-semibold break-all"
                >
                  {FINAL_FORM_URL}
                </a>
                <button 
                  onClick={() => window.close()}
                  className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-300"
                >
                    關閉視窗
                </button>
             </div>
        )}

        <div ref={bottomRef} />
      </div>
    );
  };

  const progressPercentage = ((currentStepIndex + 1) / STEP_SEQUENCE.length) * 100;

  if (!hasStarted) {
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">永續行動實踐AI</h1>
            <p className="text-slate-600 mb-8">點擊下方按鈕開始實驗<br/>(Click to Start Experiment)</p>
            <button 
              onClick={() => {
                setIsTextVisible(false); // Reset before starting
                unlockAudio();
                setHasStarted(true);
              }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              開始 (Start)
            </button>
          </div>
       </div>
    );
  }

  return (
    <Layout progress={progressPercentage} stepName={`Step ${currentStepIndex + 1}`}>
      <AllenAvatar isSpeaking={isSpeaking} />
      {renderContent()}
    </Layout>
  );
};

export default App;
