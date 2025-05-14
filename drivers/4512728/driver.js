'use strict'

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class MyDriver extends SrZigBeeDriver {

  onInit () {
    super.onInit()

    this.getDeviceTriggerCard('4512728_on').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512728_off').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512728_level_move_with_onoff').
      registerRunListener(async (args, state) => {
        return true
      })

    this.getDeviceTriggerCard('4512728_level_stop_with_onoff').
      registerRunListener(async (args, state) => {
        return true
      })
  }

}

module.exports = MyDriver
