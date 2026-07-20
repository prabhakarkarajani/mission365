import { EventBus } from './eventBus';

describe('EventBus', () => {
  it('delivers the emitted payload to a subscribed listener', () => {
    const bus = new EventBus();
    const listener = jest.fn();

    bus.on<{ id: string }>('thing.created', listener);
    bus.emit('thing.created', { id: 'abc' });

    expect(listener).toHaveBeenCalledWith({ id: 'abc' });
  });

  it('delivers to every listener subscribed to the same event', () => {
    const bus = new EventBus();
    const first = jest.fn();
    const second = jest.fn();

    bus.on('thing.created', first);
    bus.on('thing.created', second);
    bus.emit('thing.created', { id: 'abc' });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not deliver events to listeners of a different event name', () => {
    const bus = new EventBus();
    const listener = jest.fn();

    bus.on('thing.created', listener);
    bus.emit('thing.deleted', { id: 'abc' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivering once the unsubscribe function returned by on() is called', () => {
    const bus = new EventBus();
    const listener = jest.fn();

    const unsubscribe = bus.on('thing.created', listener);
    unsubscribe();
    bus.emit('thing.created', { id: 'abc' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivering once off() is called with the original listener reference', () => {
    const bus = new EventBus();
    const listener = jest.fn();

    bus.on('thing.created', listener);
    bus.off('thing.created', listener);
    bus.emit('thing.created', { id: 'abc' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('fires a once() listener at most one time', () => {
    const bus = new EventBus();
    const listener = jest.fn();

    bus.once('thing.created', listener);
    bus.emit('thing.created', { id: 'first' });
    bus.emit('thing.created', { id: 'second' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ id: 'first' });
  });

  it('reports how many listeners are subscribed to an event', () => {
    const bus = new EventBus();

    expect(bus.listenerCount('thing.created')).toBe(0);
    bus.on('thing.created', jest.fn());
    bus.on('thing.created', jest.fn());
    expect(bus.listenerCount('thing.created')).toBe(2);
  });

  it('does not throw the caller of emit() when there are no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('thing.created', { id: 'abc' })).not.toThrow();
  });
});
