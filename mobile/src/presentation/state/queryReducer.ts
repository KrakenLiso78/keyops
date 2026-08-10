export type QueryState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: string;
};
export type QueryAction<T> =
  | { type: 'load' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: string }
  | { type: 'reset' };
export function queryReducer<T>(state: QueryState<T>, action: QueryAction<T>): QueryState<T> {
  if (action.type === 'load') return { ...state, status: 'loading', error: undefined };
  if (action.type === 'success') return { status: 'success', data: action.data };
  if (action.type === 'error') return { ...state, status: 'error', error: action.error };
  return { status: 'idle' };
}
