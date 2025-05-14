'use strict'

const { CLUSTER } = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')

class MyDevice extends ZigBeeDevice {

  async onNodeInit ({ zclNode, node }) {

    this.enableDebug()

    this.registerCapability('onoff', CLUSTER.ON_OFF)

    this.meteringFactor = 1.0 / 3600000
    this.activePowerFactor = 0.1

    this.registerCapability('meter_power', CLUSTER.METERING)
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT)

    this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
      get: 'measuredValue',
      report: 'measuredValue',
      reportParser: async value => {
        // MeasuredValue represents the temperature in degrees Celsius as follows:
        // MeasuredValue = 100 x temperature in degrees Celsius.
        return Math.round((value / 100) * 10) / 10
      },
    })
  }

}

module.exports = MyDevice
