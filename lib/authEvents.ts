/**
 * Tiny pub-sub for cross-module auth events.
 * Used to drive the refresh progress bar and session-expired toast
 * without coupling api.ts to React.
 */

type AuthEvent = 'refresh-start' | 'refresh-end' | 'auth-fail';

type Listener = () => void;
const listeners: Partial<Record<AuthEvent, Set<Listener>>> = {};

export const authEvents = {
  on(event: AuthEvent, cb: Listener): () => void {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event]!.add(cb);
    return () => listeners[event]?.delete(cb);
  },
  emit(event: AuthEvent) {
    listeners[event]?.forEach((cb) => cb());
  },
};
