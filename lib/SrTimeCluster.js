'use strict'

const { Cluster, TimeCluster, ZCLDataTypes, ZCLDataType, zclTypes } = require(
  'zigbee-clusters')

const utcDataType = new ZCLDataType(226 , 'UTC', 4, intToBuf, intFromBuf)

function intToBuf(buf, v, i) {
  return buf.writeIntLE(v, i, this.length) - i;
}

function intFromBuf(buf, i) {
  if (buf.length - i < this.length) return 0;
  return buf.readIntLE(i, this.length);
}

const ATTRIBUTES = {
  time: { id: 0x0000, type: utcDataType },
  timeStatus: { id: 0x0001,
    type: ZCLDataTypes.map8('master', 'synchronized', 'masterZoneDst',
      'superseding'),
  },
  timezone: { id: 0x0002, type: ZCLDataTypes.int32 },
  localTime: { id: 0x0007, type: ZCLDataTypes.uint32 },
  lastSetTime: { id: 0x0008, type: ZCLDataTypes.uint32 },
  privateTime: { id: 0x1000, type: ZCLDataTypes.uint32 },
}

const COMMANDS = {}

class SrTimeCluster extends TimeCluster {

  static get ATTRIBUTES () {
    return ATTRIBUTES
  }

  static get COMMANDS () {
    return COMMANDS
  }

}

module.exports = SrTimeCluster
