'use strict'

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class MyDriver extends SrZigBeeDriver {

  onInit () {
    super.onInit()

    this.getDeviceTriggerCard('4512701_on').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512701_off').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512701_level_move_with_onoff').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512701_level_stop_with_onoff').
      registerRunListener(async (args, state) => {
        return true
      })
  }

}

module.exports = MyDriver
