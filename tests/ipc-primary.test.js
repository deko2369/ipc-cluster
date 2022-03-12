jest.mock('cluster');
const cluster = require('cluster');
const EventEmitter = require('events');
const { ipcPrimary } = require('../lib/ipc-cluster');

describe('IpcPrimary', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    cluster.__resetMock();
    cluster.__setPrimaryProcess();

    ipcPrimary.removeAllListeners();
  });

  it('can not use in worker process', () => {
    cluster.__setWorkerProcess();

    expect(() => ipcPrimary.on('test', () => {
    }))
      .toThrowError(new Error('Process is not primary'));
  })

  it('registers with the event listener of the cluster module', () => {
    expect(ipcPrimary.registered).toBeFalsy();
    ipcPrimary.on('test1', () => {
    });
    expect(ipcPrimary.registered).toBeTruthy();
  });

  it('receives an event from worker', (done) => {
    const self = ipcPrimary.on('test2', (worker, arg1, arg2, arg3) => {
      expect(worker).toBeNull();
      expect(arg1).toEqual(1);
      expect(arg2).toEqual(2);
      expect(arg3).toEqual(3);
      done();
    });
    expect(self).toEqual(ipcPrimary);

    // emitted by worker
    cluster.emit('message', null, { eventName: 'test2', args: [1, 2, 3] });
  });

  it('does not fired event when an unexpected format message is emitted', (done) => {
    ipcPrimary.on('test3', () => {
      done(new Error());
    });

    let fired = cluster.emit('message', null, 'unexpected format message');
    expect(fired).toBeTruthy();
    fired = cluster.emit('message', null, null);
    expect(fired).toBeTruthy();
    fired = cluster.emit('message');
    expect(fired).toBeTruthy();

    setTimeout(done, 500);
  });

  it('calls another EventEmitter methods', () => {
    let self;
    const listener = () => {
    };

    const onceMock = jest
      .spyOn(EventEmitter.prototype, 'once');
    self = ipcPrimary.once('once-event', listener);
    expect(self).toEqual(ipcPrimary);
    expect(onceMock).toHaveBeenCalledWith('once-event', listener);

    const prependListenerMock = jest
      .spyOn(EventEmitter.prototype, 'prependListener');
    self = ipcPrimary.prependListener('prepend-listener-event', listener);
    expect(self).toEqual(ipcPrimary);
    expect(prependListenerMock).toHaveBeenCalledWith('prepend-listener-event', listener);

    const prependOnceListenerMock = jest
      .spyOn(EventEmitter.prototype, 'prependOnceListener');
    self = ipcPrimary.prependOnceListener('prepend-once-listener-event', listener);
    expect(self).toEqual(ipcPrimary);
    expect(prependOnceListenerMock).toHaveBeenCalledWith('prepend-once-listener-event', listener);
  });

  it('sends event to workers', () => {
    const { Worker } = jest.requireActual('cluster');

    const sendMock = jest
      .spyOn(Worker.prototype, 'send')
      .mockReturnValue(true);

    cluster.__setWorkers([new Worker(), new Worker(), new Worker()]);

    const fired = ipcPrimary.send('primary-event', 1, 2, 3);

    expect(fired).toBeTruthy();
    expect(sendMock).toHaveBeenCalledTimes(3);
    expect(sendMock).lastCalledWith({
      eventName: 'primary-event',
      args: [1, 2, 3]
    });
  });
});
