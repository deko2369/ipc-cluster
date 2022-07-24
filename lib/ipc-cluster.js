import cluster from 'cluster';
import EventEmitter from 'events';

const isIpcMessage = (message) => {
  if (typeof message !== 'object') {
    return false;
  }
  if (!message) {
    return false;
  }
  return ('eventName' in message) && ('args' in message);
}

class IpcPrimary extends EventEmitter {
  constructor(options) {
    super(options);
    this.registered = false;
  }

  registerEvent() {
    if (this.registered) {
      return;
    }

    cluster.on('message', (worker, message) => {
      if (!isIpcMessage(message)) {
        return;
      }
      const { eventName, args } = message;
      super.emit(eventName, worker, ...args);
    });

    this.registered = true;
  }

  checkPrimary() {
    if (!cluster.isMaster) {
      throw new Error('Process is not primary');
    }
  }

  on(eventName, listener) {
    this.checkPrimary();
    super.on(eventName, listener);
    this.registerEvent();

    return this;
  }

  once(eventName, listener) {
    this.checkPrimary();
    super.once(eventName, listener);
    this.registerEvent();

    return this;
  }

  prependListener(eventName, listener) {
    this.checkPrimary();
    super.prependListener(eventName, listener);
    this.registerEvent();

    return this;
  }

  prependOnceListener(eventName, listener) {
    this.checkPrimary();
    super.prependOnceListener(eventName, listener);
    this.registerEvent();

    return this;
  }

  sendTo(workers, eventName, ...args) {
    this.checkPrimary();
    return workers.map(w => w.send({ eventName, args })).every(v => v);
  }

  send(eventName, ...args) {
    return this.sendTo(Object.values(cluster.workers), eventName, ...args);
  }
}

class IpcWorker extends EventEmitter {
  constructor(options) {
    super(options);
    this.registered = false;
  }

  registerEvent() {
    if (this.registered) {
      return;
    }

    process.on('message', (message) => {
      if (!isIpcMessage(message)) {
        return;
      }
      const { eventName, args } = message;
      super.emit(eventName, ...args);
    });

    this.registered = true;
  }

  checkWorker() {
    if (!cluster.isWorker) {
      throw new Error('Process is not worker');
    }
  }

  on(eventName, listener) {
    this.checkWorker();
    super.on(eventName, listener);
    this.registerEvent();

    return this;
  }

  once(eventName, listener) {
    this.checkWorker();
    super.once(eventName, listener);
    this.registerEvent();

    return this;
  }

  prependListener(eventName, listener) {
    this.checkWorker();
    super.prependListener(eventName, listener);
    this.registerEvent();

    return this;
  }

  prependOnceListener(eventName, listener) {
    this.checkWorker();
    super.prependOnceListener(eventName, listener);
    this.registerEvent();

    return this;
  }

  send(eventName, ...args) {
    this.checkWorker();
    return cluster.worker.send({ eventName, args });
  }
}

const primary = new IpcPrimary();
const worker = new IpcWorker();

export {
  primary as ipcPrimary,
  worker as ipcWorker
};