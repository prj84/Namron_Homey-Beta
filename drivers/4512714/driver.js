'use strict'

const SrZwaveDriver = require('../../lib/SrZwaveDriver')

class MyDriver extends SrZwaveDriver {

  onInit () {
    super.onInit()

    this.onFlowTrigger = this.getDeviceTriggerCard('4512714_on')
    this.onFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })

    this.offFlowTrigger = this.getDeviceTriggerCard('4512714_off')
    this.offFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })

    this.onKeyHeldDownFlowTrigger = this.getDeviceTriggerCard(
      '4512714_on_key_held_down')
    this.onKeyHeldDownFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })

    this.onKeyReleasedFlowTrigger = this.getDeviceTriggerCard('4512714_on_key_released')
    this.onKeyReleasedFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })

    this.offKeyHeldDownFlowTrigger = this.getDeviceTriggerCard(
      '4512714_off_key_held_down')
    this.offKeyHeldDownFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })

    this.offKeyReleasedFlowTrigger = this.getDeviceTriggerCard(
      '4512714_off_key_released')
    this.offKeyReleasedFlowTrigger.registerRunListener(async (args, state) => {
      return args.group === state.group
    })
  }
}

module.exports = MyDriver
