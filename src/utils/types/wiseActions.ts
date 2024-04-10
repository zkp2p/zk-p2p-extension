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
