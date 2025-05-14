import {ZigBeeDevice} from 'homey-zigbeedriver';
import {Cluster} from 'zigbee-clusters';

enum TuyaDataType {
  Raw = 0x00, // [ Bytes ]
  Boolean = 0x01, // [ 0/1 ]
  Value = 0x02, // [ 4 byte value ]
  String = 0x03, // [ N byte string ]
  Enum = 0x04, // [ 0-255 ]
  Bitmap = 0x05, // [1,2,4 bytes ] as bits
}

export interface TuyaDataPointPackage {
  sequenceNumber: number;
  dataPoint: number;
  dataType: TuyaDataType;
  length: number;
  data: Buffer;
}

export interface TuyaSpecificClusterMethods extends Cluster {
  dataRequest(opts: TuyaDataPointPackage): Promise<void>;

  syncTime(opts: {
    sequenceNumber: number,
    data: Buffer
  }): Promise<void>;
}

export class TuyaCommunicator {
  public readonly cluster: TuyaSpecificClusterMethods;
  private readonly debugger: (...args: unknown[]) => void;
  private readonly logger: (...args: unknown[]) => void;
  private _transactionId = 0;

  constructor(device: ZigBeeDevice, cluster: Cluster) {
    this.debugger = device.debug;
    this.logger = device.log;
    this.cluster = cluster as unknown as TuyaSpecificClusterMethods;
  }

  public readBool(data: Buffer): boolean {
    return data.readUInt8() === 1;
  }

  public async writeBool(dataPoint: number, value: boolean): Promise<void> {
    const data = Buffer.alloc(1);
    data.writeUInt8(value ? 0x01 : 0x00, 0);
    this.debugger('Writing bool value', data);

    return this.cluster.dataRequest({
      sequenceNumber: this.transactionId++,
      dataPoint,
      dataType: TuyaDataType.Boolean,
      length: 1,
      data,
    });
  }

  public readData32(data: Buffer): number {
    return data.readUInt32BE();
  }

  public async writeData32(dataPoint: number, value: number): Promise<void> {
    const data = Buffer.alloc(4);
    data.writeUInt32BE(value, 0);
    this.debugger('Writing uint32 value', data);

    return this.cluster.dataRequest({
      sequenceNumber: this.transactionId++,
      dataPoint,
      dataType: TuyaDataType.Value,
      length: 4,
      data,
    });
  }

  public readString(data: Buffer): string {
    return data.toString('latin1');
  }

  public async writeString(dataPoint: number, value: string): Promise<void> {
    this.debugger('Writing string value', value);

    return this.cluster.dataRequest({
      sequenceNumber: this.transactionId++,
      dataPoint,
      dataType: TuyaDataType.String,
      length: value.length,
      data: Buffer.from(String(value), 'latin1'),
    });
  }

  public readEnum(data: Buffer): number {
    return data.readUInt8();
  }

  public async writeEnum(dataPoint: number, value: number): Promise<void> {
    const data = Buffer.alloc(1);
    data.writeUInt8(value, 0);
    this.debugger('Writing enum value', data);

    return this.cluster.dataRequest({
      sequenceNumber: this.transactionId++,
      dataPoint,
      dataType: TuyaDataType.Enum,
      length: 1,
      data,
    });
  }

  public async setTime(timezone: string): Promise<void> {
    const now = new Date();
    const utcTime = Math.floor(now.getTime() / 1000);
    const localTime = Math.floor(utcTime + TuyaCommunicator.getTimezoneOffsetInSeconds(timezone, now));

    const data = Buffer.alloc(8);
    data.writeUInt32BE(utcTime, 0);
    data.writeUInt32BE(localTime, 4);

    this.logger('Setting time information', utcTime, localTime);
    await this.cluster.syncTime({
      sequenceNumber: this.transactionId++,
      data: data,
    });
  }

  private static getTimezoneOffsetInSeconds(timezone: string, date = new Date()): number {
    const tz = date.toLocaleString('en', {
      timeZone: timezone,
      timeStyle: 'long',
    }).split(' ').slice(-1)[0];
    const dateString = date.toString();
    return Math.floor((Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`)) / 1000);
  }

  private set transactionId(val) {
    this._transactionId = val % 65536;
  }

  private get transactionId(): number {
    return this._transactionId;
  }
}
