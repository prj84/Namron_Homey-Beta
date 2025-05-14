'use strict'

const { ZwaveLightDevice } = require('homey-zwavedriver')

class DimLight extends ZwaveLightDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL')
    this.registerCapability('dim', 'SWITCH_MULTILEVEL')

    this.registerReportListener('BASIC', 'BASIC_REPORT', report => {
      if (report && report.hasOwnProperty('Current Value')) {
        if (this.hasCapability('onoff')) this.setCapabilityValue('onoff',
          report['Current Value'] > 0).catch(this.error)
        if (this.hasCapability('dim')) this.setCapabilityValue('dim',
          report['Current Value'] / 99).catch(this.error)
      }
    })

    if (this.hasCapability('meter_power')) {
      await this.registerCapability('meter_power', 'METER')
    }

    if (this.hasCapability('measure_power')) {
      await this.registerCapability('measure_power', 'METER')
    }
  }

  async startDimChange (args, state) {

    this.log(`start dim change mode ${args.mode}`)

    const mode = args.mode
    let duration = args.duration
    if (typeof mode !== 'string') {
      return false
    }
    if (typeof duration !== 'number') {
      duration = 10
    }

    const upDown = (mode === 'up') ? 'Up' : 'Down'
    const payload = {
      Properties1: {
        'Ignore Start Level': true,
        'Inc Dec': 'Increment',
        'Up Down': upDown,
      },
      'Start Level': 0,
      'Dimming Duration': duration,
      'Step Size': 7,
    }

    this.node.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_START_LEVEL_CHANGE(
      payload)
  }

  async stopDimChange(args, state) {

    return this.node.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_STOP_LEVEL_CHANGE()
  }

}

module.exports = DimLight
