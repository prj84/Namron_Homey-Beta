'use strict'

const { ZwaveLightDevice } = require('homey-zwavedriver')

class SwitchLight extends ZwaveLightDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_BINARY')
    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')

    this.registerReportListener('BASIC', 'BASIC_REPORT', report => {
      if (report && report.hasOwnProperty('Current Value')) {
        this.setCapabilityValue('onoff', report['Current Value'] > 0).catch(this.error)
      }
    })
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {

    if (newSettings.hasOwnProperty('class')) {
      let newClass = newSettings['class']
      if (this.getClass() !== newClass) {
        this.setClass(newClass).then(() => {
          this.log(`set new class success, `, newClass)
        }).catch(this.error)
      }
    }
  }

}

module.exports = SwitchLight
