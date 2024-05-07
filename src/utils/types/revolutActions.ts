export const RevolutAction = {
    REGISTRATION: 'registration',
    TRANSFER: 'transfer'
  } as const;
  
  export const revolutActions = [
    RevolutAction.REGISTRATION,
    RevolutAction.TRANSFER,
  ];
  
  export type RevolutActionType = typeof RevolutAction[keyof typeof RevolutAction];
  
  
  export const RevolutStep = {
    NAVIGATE: 'navigate',
    PROVE: 'prove',
    REVIEW: 'review'
  } as const;
  
  export const revolutSteps = [
    RevolutStep.NAVIGATE,
    RevolutStep.PROVE,
    RevolutStep.REVIEW,
  ];
  
  export type RevolutStepType = typeof RevolutStep[keyof typeof RevolutStep];
  
  export const RevolutRequest = {
    PAYMENT_PROFILE: 'payment_profile',
    TRANSFER_DETAILS: 'transfer_details',
  }
  
  export type RevolutRequestType = typeof RevolutRequest[keyof typeof RevolutRequest];
  
  
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
  
  export const REVOLUT_PLATFORM = 'revolut';