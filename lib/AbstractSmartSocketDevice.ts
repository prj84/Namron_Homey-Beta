import Homey from 'homey';
import {ClusterCapabilityConfiguration, ZigBeeDevice} from 'homey-zigbeedriver';
import {CLUSTER} from 'zigbee-clusters';

export default class AbstractSmartSocketDevice extends ZigBeeDevice {
  static capabilityConfiguration: ClusterCapabilityConfiguration = {
    reportOpts: {
      configureAttributeReporting: {
        minInterval: 10,
        maxInterval: 60,
        minChange: 1,
      },
    }
  };

  // The factors are not available from zigbee
  // noinspection JSUnusedGlobalSymbols Used by the Homey library
  protected meteringFactor = 1 / 100;
  // noinspection JSUnusedGlobalSymbols Used by the Homey library
  protected acCurrentFactor = 1 / 1000;

  async onNodeInit(): Promise<void> {
    //if (Homey.env.DEBUG === '1') {
    //  this.enableDebug();
    //}

    this.registerCapability('onoff', CLUSTER.ON_OFF);
    this.registerCapability('meter_power', CLUSTER.METERING, AbstractSmartSocketDevice.capabilityConfiguration);
    this.registerCapability('measure_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, AbstractSmartSocketDevice.capabilityConfiguration);
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, AbstractSmartSocketDevice.capabilityConfiguration);
    this.registerCapability('measure_current', CLUSTER.ELECTRICAL_MEASUREMENT, AbstractSmartSocketDevice.capabilityConfiguration);
  }
}
