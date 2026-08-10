export type OperationState<T> = {
  status: 'idle' | 'confirming' | 'submitting' | 'succeeded' | 'failed';
  receipt?: T;
  error?: string;
};
export type OperationAction<T> =
  | { type: 'confirm' }
  | { type: 'submit' }
  | { type: 'success'; receipt: T }
  | { type: 'failure'; error: string }
  | { type: 'reset' };
export function operationReducer<T>(
  state: OperationState<T>,
  action: OperationAction<T>,
): OperationState<T> {
  if (action.type === 'confirm') return { ...state, status: 'confirming', error: undefined };
  if (action.type === 'submit') return { ...state, status: 'submitting', error: undefined };
  if (action.type === 'success') return { status: 'succeeded', receipt: action.receipt };
  if (action.type === 'failure') return { ...state, status: 'failed', error: action.error };
  return { status: 'idle' };
}
