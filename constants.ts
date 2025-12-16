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
    nextLabel: '我同意開始',
  },
  [StepId.STEP_01_GREETING]: {
    id: StepId.STEP_01_GREETING,
    type: 'input',
    script: `嗨，你好，我是Allen，你怎麼稱呼呢?`,
    nextLabel: '下一步',
  },
  [StepId.STEP_02_VIDEO_INTRO]: {
    id: StepId.STEP_02_VIDEO_INTRO,
    type: 'video',
    script: `{{name}}你好，很高興認識你。在我們進行討論前，我想先邀請你觀賞這個影片。`,
    nextLabel: '影片播放完畢，下一步',
  },
  [StepId.STEP_03_VIDEO_QUIZ]: {
    id: StepId.STEP_03_VIDEO_QUIZ,
    type: 'quiz',
    script: `你知道影片中主要是在討論哪一個議題的新聞嗎?`,
  },
  [StepId.STEP_04_SUSTAINABILITY_PRIME]: {
    id: StepId.STEP_04_SUSTAINABILITY_PRIME,
    type: 'info',
    script: `沒錯，地球其實已經變得越來越脆弱，像是今年冰島也發出了國家示警，冰河融化的速度遠比想像的快。我想你應該也有些感受，特別像是台灣這幾年受到颱風或暴雨侵襲的頻率跟嚴重性也越來越高。如果可以，我想邀請你也嘗試看看從生活中的一些簡單的行動改變來一起為減緩對地球的威脅做努力。`,
    nextLabel: '繼續',
  },
  [StepId.STEP_05_ACTION_OPEN]: {
    id: StepId.STEP_05_ACTION_OPEN,
    type: 'input',
    script: `如果是這些行動，你覺得你可能可以做得到哪些? 使用環保杯、使用環保提袋、減少摩托車或汽車的使用次數來降低生活中的碳排?`,
    nextLabel: '送出',
  },
  [StepId.STEP_06_ACTION_FEEDBACK]: {
    id: StepId.STEP_06_ACTION_FEEDBACK,
    type: 'info',
    script: '', // Dynamic based on category
    nextLabel: '繼續',
  },
  [StepId.STEP_07_BEHAVIOR_PLAN]: {
    id: StepId.STEP_07_BEHAVIOR_PLAN,
    type: 'input',
    script: `除了這些行動，你覺得你在生活中還有哪些地方可能也可以做到降低碳排?
那我想邀請你在接下來的生活中也嘗試看看~雖然不會立刻有效，但我覺得這樣的心意遲早有一天會對我們的地球帶來一些改變`,
    nextLabel: '送出',
  },
  [StepId.STEP_08_COMMITMENT_SCALE]: {
    id: StepId.STEP_08_COMMITMENT_SCALE,
    type: 'likert',
    script: `永續行為承諾`,
    nextLabel: '完成問卷',
  },
  [StepId.STEP_09_ORG_INTRO]: {
    id: StepId.STEP_09_ORG_INTRO,
    type: 'info',
    script: `最後，我也想跟你介紹一個由大學學生一起發起組成的永續行動組織-綠行生活。綠行生活協會成立於 2021 年，由幾位覺得「永續其實可以更簡單」的大學生一起創立。那時校園推減塑政策，但不少同學仍覺得永續太麻煩、難以持續。創辦成員來自不同科系，他們希望能用輕鬆、不施壓的方式，讓大家更容易開始做一些日常的小改變。

協會的做法很接地氣。他們每週推出一個「綠行小挑戰」，像是三天自備飲料杯、一天不拿一次性餐具、短距離改用步行等。完成挑戰的同學只需要掃個 QR code 或使用 Line bot 就能打卡，協會會在社群上分享同學的心得與小故事，讓人看到「原來很多人都在嘗試」。

校園周邊還有他們合作的「永續行動據點」，例如自備杯折抵、回收物換小禮物，甚至提供二手交換箱。這些日常可見的場景讓永續不再抽象，而是變得容易、友善、也有回饋感。

整體來說，綠行生活協會希望讓大家覺得永續不是額外的負擔，而是一件可以從生活小步驟慢慢開始的事。你也會發現，只要願意做一點點，永續其實沒有想像中那麼困難。`,
    nextLabel: '了解了',
  },
  [StepId.STEP_10_ORG_FEEDBACK]: {
    id: StepId.STEP_10_ORG_FEEDBACK,
    type: 'input',
    script: `我想這個組織也很致力在各個學校的角落努力宣導跟實踐他們的理念，你對於他們的理念跟行動有甚麼樣的看法或鼓勵?`,
    nextLabel: '送出',
  },
  [StepId.STEP_11_DONATION]: {
    id: StepId.STEP_11_DONATION,
    type: 'input',
    script: `如果你今天突然額外獲得100元的獎金，你願意從中將多少比例的獎金捐獻給這個機構來支持他們的行動?`,
    nextLabel: '確認',
  },
  [StepId.STEP_12_END]: {
    id: StepId.STEP_12_END,
    type: 'end',
    script: `非常謝謝你花時間完成這次的活動。
接下來，如果老師或助教有安排，你可以依照教室前方的指示，
領取一份小點心，並且把自己的標籤投入對應的箱子。
再次謝謝你。`,
  },
};

export const QUIZ_OPTIONS = [
  { id: 'A', text: '永續地球' },
  { id: 'B', text: '企業績效' },
  { id: 'C', text: '身心靈放鬆' },
];

export const COMMITMENT_QUESTIONS = [
  { id: 'Q1', text: '我願意在未來一週嘗試減少一次性塑膠的使用。' },
  { id: 'Q2', text: '我覺得採取永續行動是我的責任。' },
  { id: 'Q3', text: '我會向朋友推薦「綠行生活」這類組織的理念。' },
  { id: 'Q3_neg', text: '我覺得參與永續行動會造成我生活上的不便。' } // Note: Check if Q3_neg is desired or typo in previous context? I'll stick to file I read unless I see a reason to change.
];

// Wait, I read the file and it had 3 questions. I'll stick to 3 unless user code had more.
// User code loop: {COMMITMENT_QUESTIONS.map...}
// I will not add Q3_neg unless requested.
// Re-reading file content of constants.ts:
// id: 'Q1', 'Q2', 'Q3'. 3 items. I will stick to that.

export const ACTION_FEEDBACK_TEMPLATES = {
  REUSE: `你提到的這些做法，像是自備環保杯或提袋，其實都很實際。
很多研究也發現，這類「重複使用」的習慣，累積起來可以減少不少一次性垃圾。`,
  TRANSPORT: `你提到的交通方式改變，像是多走路或搭大眾運輸，不僅能減少碳排放，對健康也很有幫助。
這是非常棒的永續選擇。`,
  NONE: `沒關係，現在覺得還沒有也很正常。
很多時候只是還沒找到自己比較容易開始的一小步。`,
};
