import * as EventEmitter from 'events';
import { Worker } from 'cluster';

export interface IpcPrimary extends EventEmitter {
  on(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  addListener(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  once(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  prependListener(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  prependOnceListener(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  removeListener(event: string | symbol, listener: (worker: Worker, ...args: any[]) => void): this;
  send(event: string | symbol, ...args: any[]): boolean;
  sendTo(workers: Worker[], event: string | symbol, ...args: any[]): boolean;
}

export interface IpcWorker extends EventEmitter {
  send(event: string | symbol, ...args: any[]): boolean;
}

export const ipcPrimary: IpcPrimary;
export const ipcWorker: IpcWorker;
