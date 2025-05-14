'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

class MyOutlet extends ZwaveDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_BINARY')

    if (this.hasCapability('measure_power')) {

      this.registerCapability('measure_power', 'METER')
    }

    if (this.hasCapability('meter_power')) {

      this.registerCapability('meter_power', 'METER')
    }
  }

}

module.exports = MyOutlet
