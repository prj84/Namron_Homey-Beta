import {Cluster, ZCLDataTypes} from 'zigbee-clusters';

const ATTRIBUTES = {};

const COMMANDS = {
  dataRequest: {
    id: 0x0,
    frameControl: ['clusterSpecific', 'disableDefaultResponse'],
    args: {
      sequenceNumber: ZCLDataTypes.uint16,
      dataPoint: ZCLDataTypes.uint8,
      dataType: ZCLDataTypes.uint8,
      length: ZCLDataTypes.data16,
      data: ZCLDataTypes.buffer,
    },
  },
  dataResponse: {
    id: 0x1,
    args: {
      sequenceNumber: ZCLDataTypes.uint16,
      dataPoint: ZCLDataTypes.uint8,
      dataType: ZCLDataTypes.uint8,
      length: ZCLDataTypes.data16,
      data: ZCLDataTypes.buffer,
    },
  },
  dataReport: {
    id: 0x2,
    args: {
      sequenceNumber: ZCLDataTypes.uint16,
      dataPoint: ZCLDataTypes.uint8,
      dataType: ZCLDataTypes.uint8,
      length: ZCLDataTypes.data16,
      data: ZCLDataTypes.buffer,
    },
  },
  tuyaMcuVersionRsp: {
    id: 0x11,
  },
  syncTime: {
    id: 0x24,
    frameControl: ['clusterSpecific', 'disableDefaultResponse'],
    args: {
      sequenceNumber: ZCLDataTypes.uint16,
      data: ZCLDataTypes.buffer,
    },
  },
};

export default class TuyaSpecificCluster extends Cluster {
  static get ID(): number {
    return 61184;
  }

  static get NAME(): string {
    return 'tuya';
  }

  static get ATTRIBUTES(): unknown {
    return ATTRIBUTES;
  }

  static get COMMANDS(): unknown {
    return COMMANDS;
  }

  onDataResponse(args: unknown): void {
    this.emit('tuya.dataResponse', args);
  }

  onDataReport(args: unknown): void {
    this.emit('tuya.dataReport', args);
  }

  onTuyaMcyVersionRsp(): void {
    // Data is not needed
  }

  onSyncTime(): void {
    // Can be received from the device, but there is no need to act on it
  }
}

Cluster.addCluster(TuyaSpecificCluster);
