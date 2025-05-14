'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

class MySensor extends ZwaveDevice {

  async onNodeInit ({ node }) {

    /*
    this.enableDebug()
    this.printNode()
     */

    this.registerCapability('measure_battery', 'BATTERY')
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL')
    this.registerCapability('measure_luminance', 'SENSOR_MULTILEVEL')
    this.registerCapability('measure_humidity', 'SENSOR_MULTILEVEL')
    this.registerCapability('alarm_motion', 'NOTIFICATION')
  }

}

module.exports = MySensor
