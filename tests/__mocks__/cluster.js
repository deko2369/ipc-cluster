const EventEmitter = require('events');

class ClusterMock extends EventEmitter {
  constructor(props) {
    super(props);
    this.__resetMock();
  }

  __resetMock() {
    this.__setPrimaryProcess();
    this.worker = null;
    this.workers = [];
  }

  __setPrimaryProcess() {
    this.isMaster = true;
    this.isPrimary = true;
    this.isWorker = false;
  }

  __setWorkerProcess() {
    this.isMaster = false;
    this.isPrimary = false;
    this.isWorker = true;
  }

  __setWorker(worker) {
    this.worker = worker;
  }

  __setWorkers(workers) {
    this.workers = workers;
  }
}

module.exports = new ClusterMock();