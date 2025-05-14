/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'homey-log' {
  import Homey from 'homey';

  export class Log {
    constructor(args: { homey: Homey });
  }
}
