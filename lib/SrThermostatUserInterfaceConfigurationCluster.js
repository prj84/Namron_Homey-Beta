'use strict'

const { Cluster, ZCLDataTypes } = require(
  'zigbee-clusters')

const ATTRIBUTES = {
  keypadLockout: {
    id: 0x0001,
    type: ZCLDataTypes.enum8({
      noLockout: 0,
      level1Lockout: 1,
      level2Lockout: 2,
      level3Lockout: 3,
      level4Lockout: 4,
      level5Lockout: 5,
    }),
  },
  temperatureDisplayMode: {
    id: 0x0000,
    type: ZCLDataTypes.enum8({
      temperature_display_mode_c: 0,
      temperature_display_mode_f: 1,
    })
  },
}

const COMMANDS = {}

class SrThermostatUserInterfaceConfigurationCluster extends Cluster {

  static get ID() {
    return 0x0204;
  }

  static get NAME() {
    return 'thermostatUserInterfaceConfiguration';
  }

  static get ATTRIBUTES () {
    return ATTRIBUTES
  }

  static get COMMANDS () {
    return COMMANDS
  }

}

module.exports = SrThermostatUserInterfaceConfigurationCluster
