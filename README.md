ipc-cluster
===========

Inter-process communication module for Node.js clusters

## Usage

### Install

```
$ npm install ipc-cluster
```

### Usage

```ecmascript 6
const cluster = require('cluster');
const express = require('express');

const { ipcPrimary, ipcWorker } = require('ipc-cluster');

if (cluster.isMaster) {
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  ipcPrimary.on('requested', (worker, msg) => {
    console.log(`received '${msg}' from ${worker.process.pid}`);

    // Time-consuming process...

    // Emit to all worker processes
    ipcPrimary.emit('process-finished', 'primary message');
    // Emit to specific worker processes
    ipcPrimary.emitTo([worker], 'process-finished', 'primary message');
  });
} else if (cluster.isWorker) {
  const app = express();
  const port = 8000;

  app.get('/', (req, res) => {
    // Emit to primary process
    ipcWorker.emit('requested', 'worker message');
    res.status(200).send('OK');
  });

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });

  ipcWorker.on('process-finished', (msg) => {
    console.log(`received '${msg}' from primary process`);
  });

  console.log(`worker ${process.pid} started`);
}
```

## License

[MIT License](./LICENSE) - Copyright (c) deko2369