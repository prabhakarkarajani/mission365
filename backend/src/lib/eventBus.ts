import { EventEmitter } from 'node:events';

type Listener<T> = (payload: T) => void;

/**
 * Minimal in-process pub/sub for decoupling side effects from the service
 * that triggers them (e.g. a future AI engine reacting to `dream.created`
 * without goal.service/dream.service knowing it exists). Deliberately not
 * backed by Redis/BullMQ — ADR-001's MVP-scale reasoning applies here too;
 * introduce a real queue only when a listener needs to survive a process
 * restart or run out-of-process.
 */
class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    this.emitter.on(event, listener as Listener<unknown>);
    return () => this.emitter.off(event, listener as Listener<unknown>);
  }

  once<T = unknown>(event: string, listener: Listener<T>): void {
    this.emitter.once(event, listener as Listener<unknown>);
  }

  off<T = unknown>(event: string, listener: Listener<T>): void {
    this.emitter.off(event, listener as Listener<unknown>);
  }

  emit<T = unknown>(event: string, payload: T): void {
    this.emitter.emit(event, payload);
  }

  listenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }
}

export const eventBus = new EventBus();
export { EventBus };
export type { Listener };
