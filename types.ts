export enum StepId {
  STEP_00_INTRO = 'STEP_00_INTRO',
  STEP_01_GREETING = 'STEP_01_GREETING',
  STEP_02_VIDEO_INTRO = 'STEP_02_VIDEO_INTRO',
  STEP_03_VIDEO_QUIZ = 'STEP_03_VIDEO_QUIZ',
  STEP_04_SUSTAINABILITY_PRIME = 'STEP_04_SUSTAINABILITY_PRIME',
  STEP_05_ACTION_OPEN = 'STEP_05_ACTION_OPEN',
  STEP_06_ACTION_FEEDBACK = 'STEP_06_ACTION_FEEDBACK',
  STEP_07_BEHAVIOR_PLAN = 'STEP_07_BEHAVIOR_PLAN',
  STEP_08_COMMITMENT_SCALE = 'STEP_08_COMMITMENT_SCALE',
  STEP_09_ORG_INTRO = 'STEP_09_ORG_INTRO',
  STEP_10_ORG_FEEDBACK = 'STEP_10_ORG_FEEDBACK',
  STEP_11_DONATION = 'STEP_11_DONATION',
  STEP_12_END = 'STEP_12_END',
}

export interface UserData {
  participantId: string;
  name: string;
  quizAnswer: string;
  actionOpenAnswer: string;
  actionCategory: 'REUSE' | 'TRANSPORT' | 'NONE';
  behaviorPlan: string;
  commitmentAnswers: Record<string, number>; // questionId -> value
  orgFeedback: string;
  donationAmount: number;
  consent: boolean;
}

export interface StepConfig {
  id: StepId;
  type: 'info' | 'input' | 'video' | 'quiz' | 'likert' | 'end';
  script: string; // The text Allen shows
  spokenScript?: string; // Optional: The text Allen speaks (if different from script)
  audioUrl?: string; // Optional pre-generated audio
  nextLabel?: string;
}

export type ActionCategory = 'REUSE' | 'TRANSPORT' | 'NONE';

export const INITIAL_USER_DATA: UserData = {
  participantId: '',
  name: '',
  quizAnswer: '',
  actionOpenAnswer: '',
  actionCategory: 'NONE',
  behaviorPlan: '',
  commitmentAnswers: {},
  orgFeedback: '',
  donationAmount: 0,
  consent: false,
};