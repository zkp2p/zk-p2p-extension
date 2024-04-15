export const WiseAction = {
  REGISTRATION: 'registration',
  DEPOSITOR_REGISTRATION: 'depositor_registration',
  TRANSFER: 'transfer'
} as const;

export const wiseActions = [
  WiseAction.REGISTRATION,
  WiseAction.DEPOSITOR_REGISTRATION,
  WiseAction.TRANSFER,
];

export type WiseActionType = typeof WiseAction[keyof typeof WiseAction];


export const WiseStep = {
  NAVIGATE: 'navigate',
  PROVE: 'prove',
  REVIEW: 'review'
} as const;

export const wiseSteps = [
  WiseStep.NAVIGATE,
  WiseStep.PROVE,
  WiseStep.REVIEW,
];

export type WiseStepType = typeof WiseStep[keyof typeof WiseStep];
