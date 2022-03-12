jest.mock('cluster');
const cluster = require('cluster');
const EventEmitter = require('events');
const { ipcWorker } = require('../lib/ipc-cluster');

describe('IpcWorker', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    cluster.__resetMock();
    cluster.__setWorkerProcess();

    ipcWorker.removeAllListeners();
  });

  it('can not use in primary process', () => {
    cluster.__setPrimaryProcess();

    expect(() => ipcWorker.on('test', () => {
    }))
      .toThrowError(new Error('Process is not worker'));
  })

  it('registers with the event listener of worker process', () => {
    expect(ipcWorker.registered).toBeFalsy();
    ipcWorker.on('test1', () => {
    });
    expect(ipcWorker.registered).toBeTruthy();
  });

  it('receives an event from primary', (done) => {
    const self = ipcWorker.on('test2', (arg1, arg2, arg3) => {
      expect(arg1).toEqual(1);
      expect(arg2).toEqual(2);
      expect(arg3).toEqual(3);
      done();
    });
    expect(self).toEqual(ipcWorker);

    // emitted by primary
    process.emit('message', { eventName: 'test2', args: [1, 2, 3] });
  });

  it('does not fired event when an unexpected format message is emitted', (done) => {
    ipcWorker.on('test3', () => {
      done(new Error());
    });

    let fired = process.emit('message', null, 'unexpected format message');
    expect(fired).toBeTruthy();
    fired = process.emit('message', null);
    expect(fired).toBeTruthy();
    fired = process.emit('message');
    expect(fired).toBeTruthy();

    setTimeout(done, 500);
  });

  it('calls another EventEmitter methods', () => {
    let self;
    const listener = () => {
    };

    const onceMock = jest
      .spyOn(EventEmitter.prototype, 'once');
    self = ipcWorker.once('once-event', listener);
    expect(self).toEqual(ipcWorker);
    expect(onceMock).toHaveBeenCalledWith('once-event', listener);

    const prependListenerMock = jest
      .spyOn(EventEmitter.prototype, 'prependListener');
    self = ipcWorker.prependListener('prepend-listener-event', listener);
    expect(self).toEqual(ipcWorker);
    expect(prependListenerMock).toHaveBeenCalledWith('prepend-listener-event', listener);

    const prependOnceListenerMock = jest
      .spyOn(EventEmitter.prototype, 'prependOnceListener');
    self = ipcWorker.prependOnceListener('prepend-once-listener-event', listener);
    expect(self).toEqual(ipcWorker);
    expect(prependOnceListenerMock).toHaveBeenCalledWith('prepend-once-listener-event', listener);
  });

  it('sends an event to primary', () => {
    const { Worker } = jest.requireActual('cluster');

    const sendMock = jest
      .spyOn(Worker.prototype, 'send')
      .mockReturnValue(true);

    cluster.__setWorker(new Worker());

    const fired = ipcWorker.send('worker-event', 1, 2, 3);

    expect(fired).toBeTruthy();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).lastCalledWith({
      eventName: 'worker-event',
      args: [1, 2, 3]
    });
  });
});
