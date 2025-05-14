'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

class MyDevice extends ZwaveDevice {

  onNodeInit ({ node }) {

    this.registerCapability('windowcoverings_set', 'SWITCH_MULTILEVEL');

    if (this.hasCapability('measure_power')) {
      this.registerCapability('measure_power', 'METER');
    }

    if (this.hasCapability('meter_power')) {
      this.registerCapability('meter_power', 'METER');
    }
  }

}

module.exports = MyDevice
