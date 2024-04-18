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

export const WiseRequest = {
  PAYMENT_PROFILE: 'payment_profile',
  TRANSFER_DETAILS: 'transfer_details',
}

export type WiseRequestType = typeof WiseRequest[keyof typeof WiseRequest];


export interface Intent {
  onRamper: string;
  deposit: string;
  amount: string;
  timestamp: string;
  to: string;
}

export interface OnRamperIntent {
  depositorVenmoId: string;
  intent: Intent;
  fiatToSend: string;
}