'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER } = require('zigbee-clusters')

class MyDevice extends ZigBeeDevice {

  async onNodeInit ({ zclNode, node }) {

    this.registerCapability('windowcoverings_set',
      CLUSTER.WINDOW_COVERING)
    this.registerCapability('windowcoverings_state',
      CLUSTER.WINDOW_COVERING)
    this.registerCapability('windowcoverings_tilt_set',
      CLUSTER.WINDOW_COVERING)
  }

}

module.exports = MyDevice
