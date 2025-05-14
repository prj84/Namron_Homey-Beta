'use strict'

const Homey = require('homey');
const { ZigBeeLightDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER } = require('zigbee-clusters');

class DimLight extends ZigBeeLightDevice {

  async	onNodeInit({ zclNode }) {
      //this.enableDebug();
      //this.printNode();
      this.setAvailable();

      if (this.hasCapability('onoff')) {
        try {
          this.registerCapability('onoff', CLUSTER.ON_OFF);
          this.getClusterCapabilityValue('onoff', CLUSTER.ON_OFF);

          await this.configureAttributeReporting([
            {
                endpointID: 1,
                cluster: CLUSTER.ON_OFF,
                attributeName: 'onOff',
                minInterval: 0,
                maxInterval: 300,
                minChange: 0,
            },
          ]);
        } catch (err) {
          this.error('Error in registering or getting capability value (on/off): ', err)
      }
      }

      if (this.hasCapability('dim')) {
        try {
          this.registerCapability('dim', CLUSTER.LEVEL_CONTROL);
          this.getClusterCapabilityValue('dim', CLUSTER.LEVEL_CONTROL);

          await this.configureAttributeReporting([
            {
                endpointID: 1,
                cluster: CLUSTER.LEVEL_CONTROL,
                attributeName: 'currentLevel',
                minInterval: 0,
                maxInterval: 300,
                minChange: 0,
            },
          ]);
        } catch (err) {
          this.error('Error in registering or getting capability value (dim): ', err)
        }
      }
    }
}


module.exports = DimLight;