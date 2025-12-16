import { StepId, StepConfig } from './types';

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================
export const SYSTEM_CONFIG = {
  tts: {
    // Options: 'MALE' or 'FEMALE'
    // Note: Availability depends on the user's device/browser voices.
    gender: 'FEMALE' as 'MALE' | 'FEMALE', 
    
    // Playback rate: 1.0 is default. 
    // Microsoft voices (Male) are usually slower, so we set a higher rate for them.
    rateMale: 1.5,
    rateFemale: 1.2,
    
    // Pitch: 1.0 is standard. Lower (e.g. 0.9) is deeper.
    pitch: 1.0, 
  },
  ui: {
    // Speed in ms per character for the typewriter effect
    typingSpeed: 35, 
  }
};

export const VIDEO_URL = 'https://youtu.be/QpEsuZdl9Aw?si=Wgan6mgGK8fkYO1J';

// Pre-generated audio assets served from Vite public/
// These files are produced by the offline TTS backend and checked into public/tts/.
export const PRE_RECORDED_AUDIO = {
  STEP_00_INTRO: '/tts/00_intro_consent.wav',
  STEP_01_GREETING: '/tts/01_greeting.wav',
  STEP_02_VIDEO_INTRO_AFTER_NAME: '/tts/02_video_intro_after_name.wav',
  STEP_03_VIDEO_QUIZ: '/tts/03_video_quiz.wav',
  STEP_04_PRIME_CORRECT: '/tts/04_sustainability_prime_correct.wav',
  STEP_04_PRIME_WRONG: '/tts/04_sustainability_prime_wrong.wav',
  STEP_05_ACTION_OPEN: '/tts/05_action_open.wav',
  STEP_06_ACTION_NONE: '/tts/06_action_none.wav',
  STEP_07_BEHAVIOR_PLAN_QUESTION: '/tts/07_behavior_plan_question.wav',
  STEP_08_SCALE_AFTER_NONE: '/tts/08_scale_after_none.wav',
  STEP_08_SCALE_AFTER_YES_ANSWERED: '/tts/08_scale_after_yes_answered.wav',
  STEP_08_SCALE_AFTER_YES_EMPTY: '/tts/08_scale_after_yes_empty.wav',
  STEP_09_ORG_INTRO: '/tts/09_org_intro.wav',
  STEP_10_ORG_FEEDBACK: '/tts/10_org_feedback_question.wav',
  STEP_11_SELF_IDENTITY_INTRO: '/tts/11_self_identity_intro.wav',
  STEP_12_DONATION: '/tts/12_donation.wav',
  STEP_13_END: '/tts/13_end.wav',
} as const;

// The "Script" database.
// In a real production app, this might come from a DB or CMS.
export const SCRIPTS: Record<StepId, StepConfig> = {
  [StepId.STEP_00_INTRO]: {
    id: StepId.STEP_00_INTRO,
    type: 'input',
    script: `嗨，歡迎參加這次的學習活動。
接下來大約會花你 10 分鐘左右，系統會請你先看一段影片，然後回答幾個跟「日常生活與永續」有關的小問題。
這些回答沒有標準答案，你只要照自己的想法誠實回答就可以。
若你不想繼續，隨時可以關閉畫面離開，不會有任何影響。
如果你同意參與，請在畫面上點選「我同意」，我們就開始囉。`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_00_INTRO,
    nextLabel: '我同意開始',
  },
  [StepId.STEP_01_GREETING]: {
    id: StepId.STEP_01_GREETING,
    type: 'input',
    script: `嗨，你好，我是Allen，你怎麼稱呼呢?`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_01_GREETING,
    nextLabel: '下一步',
  },
  [StepId.STEP_02_VIDEO_INTRO]: {
    id: StepId.STEP_02_VIDEO_INTRO,
    type: 'video',
    script: `{{name}}你好，很高興認識你。在我們進行討論前，我想先邀請你觀賞這個影片。`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_02_VIDEO_INTRO_AFTER_NAME,
    nextLabel: '影片播放完畢，下一步',
  },
  [StepId.STEP_03_VIDEO_QUIZ]: {
    id: StepId.STEP_03_VIDEO_QUIZ,
    type: 'quiz',
    script: `你知道影片中主要是在討論哪一個議題的新聞嗎?`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_03_VIDEO_QUIZ,
  },
  [StepId.STEP_04_SUSTAINABILITY_PRIME]: {
    id: StepId.STEP_04_SUSTAINABILITY_PRIME,
    type: 'info',
    script: `沒錯，地球其實已經變得越來越脆弱，像是台灣這幾年受到颱風或暴雨侵襲的頻率跟嚴重性也越來越高。如果可以，我想邀請你也嘗試看看從生活中的一些簡單的行動改變來一起為減緩對地球的威脅做努力。`,
    nextLabel: '繼續',
  },
  [StepId.STEP_05_ACTION_OPEN]: {
    id: StepId.STEP_05_ACTION_OPEN,
    type: 'input',
    script: `如果是這些行動，你覺得你可能可以做得到哪些? 使用環保杯、使用環保提袋、減少摩托車或汽車的使用次數來降低生活中的碳排?`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_05_ACTION_OPEN,
    nextLabel: '送出',
  },
  [StepId.STEP_06_ACTION_FEEDBACK]: {
    id: StepId.STEP_06_ACTION_FEEDBACK,
    type: 'info',
    script: `沒關係的，我相信你也有那分心意想要讓地球更好，在接下來的幾天，我也想邀請你在生活中也嘗試看看~雖然不會立刻有效，但我覺得這樣的心意遲早有一天會對我們的地球帶來一些改變`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_06_ACTION_NONE,
    nextLabel: '繼續',
  },
  [StepId.STEP_07_BEHAVIOR_PLAN]: {
    id: StepId.STEP_07_BEHAVIOR_PLAN,
    type: 'input',
    script: `除了這些行動，你覺得你在生活中還有哪些地方可能也可以做到降低碳排?`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_07_BEHAVIOR_PLAN_QUESTION,
    nextLabel: '送出',
  },
  [StepId.STEP_08_COMMITMENT_SCALE]: {
    id: StepId.STEP_08_COMMITMENT_SCALE,
    type: 'likert',
    script: `接下來有個簡單的測驗想請你回答。`,
    nextLabel: '完成問卷',
  },
  [StepId.STEP_09_ORG_INTRO]: {
    id: StepId.STEP_09_ORG_INTRO,
    type: 'info',
    script: `另外呀，我也想跟你介紹一個由大學學生一起發起組成的永續行動組織-綠行生活。綠行生活協會成立於 2021 年，由幾位覺得「永續其實可以更簡單」的大學生一起創立。那時校園推減塑政策，但不少同學仍覺得永續太麻煩、難以持續。創辦成員來自不同科系，他們希望能用輕鬆、不施壓的方式，讓大家更容易開始做一些日常的小改變。

協會的做法很接地氣。他們每週推出一個「綠行小挑戰」，像是三天自備飲料杯、一天不拿一次性餐具、短距離改用步行等。完成挑戰的同學只需要掃個 QR code 或使用 Line bot 就能打卡，協會會在社群上分享同學的心得與小故事，讓人看到「原來很多人都在嘗試」。

校園周邊還有他們合作的「永續行動據點」，例如自備杯折抵、回收物換小禮物，甚至提供二手交換箱。這些日常可見的場景讓永續不再抽象，而是變得容易、友善、也有回饋感。

整體來說，綠行生活協會希望讓大家覺得永續不是額外的負擔，而是一件可以從生活小步驟慢慢開始的事。你也會發現，只要願意做一點點，永續其實沒有想像中那麼困難。`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_09_ORG_INTRO,
    nextLabel: '了解了',
  },
  [StepId.STEP_10_ORG_FEEDBACK]: {
    id: StepId.STEP_10_ORG_FEEDBACK,
    type: 'input',
    script: `我想這個組織也很致力在各個學校的角落努力宣導跟實踐他們的理念，你對於他們組織的行動有什麼感想嗎?或是能不能給他們一些鼓勵？`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_10_ORG_FEEDBACK,
    nextLabel: '送出',
  },
  [StepId.STEP_11_SELF_IDENTITY_SCALE]: {
    id: StepId.STEP_11_SELF_IDENTITY_SCALE,
    type: 'likert',
    script: `接下來能不能請你再幫我做一個簡單的測驗？`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_11_SELF_IDENTITY_INTRO,
    nextLabel: '完成問卷',
  },
  [StepId.STEP_12_DONATION]: {
    id: StepId.STEP_12_DONATION,
    type: 'input',
    script: `最後一個問題是，如果你今天突然額外獲得100元的獎金，你願意從中將多少的獎金捐獻給這個機構來支持他們的行動?`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_12_DONATION,
    nextLabel: '確認',
  },
  [StepId.STEP_13_END]: {
    id: StepId.STEP_13_END,
    type: 'end',
    script: `結束之前，我們有個連結中有最後部分的題目想請你幫忙回答。要記得填寫才算完成唷~再次感謝你的幫忙`,
    audioUrl: PRE_RECORDED_AUDIO.STEP_13_END,
  },
};

export const QUIZ_OPTIONS = [
  { id: 'A', text: '永續地球' },
  { id: 'B', text: '企業績效' },
  { id: 'C', text: '身心靈放鬆' },
];

export const COMMITMENT_QUESTIONS = [
  { id: 'C1', text: '我有信心能夠經常做到永續行動（如：以自備環保帶進行消費、使用環保杯、環保餐具、做好回收分類等等）' },
  { id: 'C2', text: '我會隨時攜帶環保用具在身上以應對臨時的消費需求（如：自備提環保袋、環保杯、環保餐具等等）' },
  { id: 'C3', text: '我經常能夠記得自備環保用具出門（如：環保提袋、環保杯、環保餐具等等）' },
  { id: 'C4', text: '我有能力判斷具有永續價值的品牌或產品' },
  { id: 'C5', text: '我能夠購買符合永續理念的產品' },
  { id: 'C6', text: '我相信我能養成符合永續的消費習慣' },
  { id: 'C7', text: '我能夠克服永續消費過程可能遇到的阻礙' },
  { id: 'C8', text: '我能夠長期從事永續消費的行動' },
  { id: 'C9', text: '我對自己能夠持之以恆進行永續行動抱持信心' },
];

export const SELF_IDENTITY_QUESTIONS = [
  { id: 'S1', text: '我認為自己是一個環保的消費者' },
  { id: 'S2', text: '我認為自己是具備環境知識的人' },
  { id: 'S3', text: '我認為自己是關心永續議題的人' },
];

export const ACTION_FEEDBACK_TEMPLATES = {
  REUSE: `你提到的這些做法，像是自備環保杯或提袋，其實都很實際。
很多研究也發現，這類「重複使用」的習慣，累積起來可以減少不少一次性垃圾。`,
  TRANSPORT: `你提到的交通方式改變，像是多走路或搭大眾運輸，不僅能減少碳排放，對健康也很有幫助。
這是非常棒的永續選擇。`,
  NONE: `沒關係的，我相信你也有那分心意想要讓地球更好，在接下來的幾天，我也想邀請你在生活中也嘗試看看~雖然不會立刻有效，但我覺得這樣的心意遲早有一天會對我們的地球帶來一些改變`,
};
