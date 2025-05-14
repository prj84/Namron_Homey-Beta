'use strict'

const { Cluster, ZCLDataTypes, zclTypes } = require(
  'zigbee-clusters')
const OccupancySensing = require(
  'zigbee-clusters/lib/clusters/occupancySensing')

const ATTRIBUTES = {
  occupancy: { id: 0, type: ZCLDataTypes.map8('occupied') }, // TODO: verify this bitmap
  occupancySensorType: {
    id: 1,
    type: ZCLDataTypes.enum8({
      pir: 0, // 0x00 PIR
      ultrasonic: 1, // 0x01 Ultrasonic
      pirAndUltrasonic: 2, // 0x02 PIR and ultrasonic
    }),
  },
  pirOccupiedToUnoccupiedDelay: { id: 16, type: ZCLDataTypes.uint16 },
  pirUnoccupiedToOccupiedDelay: { id: 17, type: ZCLDataTypes.uint16 },
  pirUnoccupiedToOccupiedThreshold: { id: 18, type: ZCLDataTypes.uint8 },
  ultrasonicOccupiedToUnoccupiedDelay: { id: 32, type: ZCLDataTypes.uint16 },
  ultrasonicUnoccupiedToOccupiedDelay: { id: 33, type: ZCLDataTypes.uint16 },
  ultrasonicUnoccupiedToOccupiedThreshold: { id: 34, type: ZCLDataTypes.uint8 },
  sensitivity: {
    id: 0x1000,
    type: ZCLDataTypes.enum8({
      default: 15,
      disablePIR: 0,
      highest: 8,
      highIV: 33,
      highIII: 57,
      highII: 82,
      highI: 106,
      middle: 131,
      lowI: 155,
      lowII: 180,
      lowIII: 205,
      lowIV: 230,
      lowest: 255
    }),
    manufacturerId: 0x1224
  }
};

class SrOccupancySensing extends OccupancySensing {

  static get ATTRIBUTES () {
    return ATTRIBUTES
  }

  static get COMMANDS () {
    return {
      setOccupancy: {
        id: 0,
        args: {
          value: ZCLDataTypes.map8('occupied'),
        },
      },
    }
  }

}

module.exports = SrOccupancySensing
