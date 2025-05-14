import Homey from 'homey';
import {
  ClusterCapabilityConfiguration,
  ClusterSpecification,
  ZigBeeDevice,
} from 'homey-zigbeedriver';
import {CLUSTER, OnOffCluster} from 'zigbee-clusters';

const pollInterval = 1000 * 60; // Every minute
const capabilityConfiguration: ClusterCapabilityConfiguration = {
  getOpts: {
    getOnStart: true,
    getOnOnline: true,
    pollInterval,
  },
};

type DeviceSettings = {
  dry_cooking_temp_threshold: number;
  dry_cooking_time_threshold: number;
}

type SettingsArguments = {
  oldSettings: DeviceSettings;
  newSettings: DeviceSettings;
  changedKeys: Array<keyof DeviceSettings>;
};

interface DryCookingStatus {
  start: number; // Start timestamp in seconds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interval: any | null; // Check interval
}

class FireFenceDevice extends ZigBeeDevice {
  protected batteryThreshold = 20;
  protected meteringFactor = 1;

  protected deviceSettings!: DeviceSettings;
  protected dryCookingTimer: DryCookingStatus | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected fastUpdateInterval: any | null = null;

  async onNodeInit(): Promise<void> {
    //if (Homey.env.DEBUG === '1') {
    //  this.enableDebug();
    //  this.debug('Debug mode enabled');
    //}

    this.deviceSettings = this.getSettings();
    await this.setupRelayControl().catch(this.error);
    await this.setupTimeout();
    await this.setupMetering().catch(this.error);
    await this.setupTimeout();
    await this.setupElectricalMeasurement().catch(this.error);
    await this.setupTimeout();
    await this.setupTemperatureReadings().catch(this.error);
    await this.setupTimeout();
    this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, capabilityConfiguration);
    await this.setupTimeout();
    this.setCapabilityValue('alarm_dry_cooking', false).catch(this.error);
  }

  onDeleted(): void {
    if (this.fastUpdateInterval) {
      this.homey.clearInterval(this.fastUpdateInterval);
    }
    if (this.dryCookingTimer?.interval) {
      this.homey.clearInterval(this.dryCookingTimer.interval);
    }

    super.onDeleted();
  }

  async onSettings({newSettings, changedKeys}: SettingsArguments): Promise<void> {
    this.debug('Device settings updated', newSettings, changedKeys);
    this.deviceSettings = newSettings;

    if (changedKeys.includes('dry_cooking_temp_threshold')) {
      const currentTemp = this.getCapabilityValue('measure_temperature');
      if (this.dryCookingTimer === null) {
        // Forward the current temperature to the handler in order to check it for the new parameters
        await this.handleCurrentTemperature(currentTemp).catch(this.error);
      } else if (currentTemp < this.deviceSettings.dry_cooking_temp_threshold) {
        // Clear when the current temperature is less than the new threshold
        this.clearDryCookingTimer();
      }
    }

    if (changedKeys.includes('dry_cooking_time_threshold') && this.dryCookingTimer !== null) {
      // Trigger extra check
      this.checkDryCookingCondition();
    }
  }

  private async setupRelayControl(): Promise<void> {
    const clusterEndpoint = this.getClusterEndpoint(CLUSTER.METERING);
    if (!clusterEndpoint) {
      return;
    }

    const cluster = this.zclNode
      .endpoints[clusterEndpoint]
      .clusters[CLUSTER.ON_OFF.NAME] as OnOffCluster;

    this.registerCapabilityListener('onoff', async (value) => {
      if (value) {
        throw new Error(this.homey.__('on_not_possible'));
      }

      await cluster.setOff();
    });

    this.homey.setInterval(
      () => cluster
        .readAttributes(['onOff'])
        .then(({onOff}) => {
          this
            .setCapabilityValue('onoff', onOff)
            .catch(this.error);
        })
        .catch(this.error),
      1000 * 10, // Every 10 seconds
    );
  }

  private async setupMetering(): Promise<void> {
    const clusterEndpoint = this.getClusterEndpoint(CLUSTER.METERING);
    if (!clusterEndpoint) {
      return;
    }

    const {multiplier, divisor} =
      await this.zclNode.endpoints[clusterEndpoint]
        .clusters[CLUSTER.METERING.NAME]
        .readAttributes(['multiplier', 'divisor']);
    this.meteringFactor = multiplier / divisor;

    this.registerCapability('meter_power', CLUSTER.METERING, capabilityConfiguration);
  }

  private async setupElectricalMeasurement(): Promise<void> {
    const clusterEndpoint = this.getClusterEndpoint(CLUSTER.ELECTRICAL_MEASUREMENT);
    if (!clusterEndpoint) {
      return;
    }

    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, capabilityConfiguration);
  }

  private async setupTemperatureReadings(): Promise<void> {
    // Just configure the default interval
    this.homey.setInterval(() => this.readTemperatureValue(), pollInterval);
  }

  private readTemperatureValue(): void {
    const clusterEndpoint = this.getClusterEndpoint(CLUSTER.TEMPERATURE_MEASUREMENT);
    if (!clusterEndpoint) {
      return;
    }

    this.zclNode.endpoints[clusterEndpoint]
      .clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
      .readAttributes(['measuredValue'])
      .then(({measuredValue}) => {
        this.debug('Temperature reading', measuredValue);
        this.handleCurrentTemperature(FireFenceDevice.parseTemperature(measuredValue)).catch(this.error);
      })
      .catch(this.error);
  }

  private readPowerValue(): void {
    const clusterEndpoint = this.getClusterEndpoint(CLUSTER.ELECTRICAL_MEASUREMENT);
    if (!clusterEndpoint) {
      return;
    }

    this.zclNode.endpoints[clusterEndpoint]
      .clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME]
      .readAttributes(['activePower'])
      .then(({activePower}) => {
        this.debug('Active power reading', activePower);
        this.setCapabilityValue('measure_power', FireFenceDevice.parsePower(activePower)).catch(this.error);
      })
      .catch(this.error);
  }

  private async handleCurrentTemperature(temp: number | null): Promise<void> {
    await this
      .setCapabilityValue('measure_temperature', temp)
      .catch(this.error);

    if (temp === null) {
      // Reset dry cooking timer when the temperature is no longer available
      this.clearDryCookingTimer();

      // Check the fast update interval
      if (this.fastUpdateInterval !== null) {
        this.debug('Stop fast update');
        this.homey.clearInterval(this.fastUpdateInterval);
        this.fastUpdateInterval = null;
      }
    } else {
      if (this.dryCookingTimer === null) {
        // Do we need to start the timer?
        if (temp >= this.deviceSettings.dry_cooking_temp_threshold) {
          this.startDryCookingTimer();
        }
      } else {
        // Timer already running
        if (temp < this.deviceSettings.dry_cooking_temp_threshold) {
          // Clear the timer
          this.clearDryCookingTimer();
        }
      }

      // Configure an additional fast interval
      if (this.fastUpdateInterval === null) {
        this.debug('Start fast update');
        this.fastUpdateInterval = this.homey.setInterval(() => {
          this.readPowerValue();
          this.readTemperatureValue();
        }, 1000 * 10);
      }
    }
  }

  private checkDryCookingCondition(): void {
    if (this.dryCookingTimer === null) {
      return;
    }

    // Calculate time difference
    const timeDiff = Math.round(Date.now() / 1000) - this.dryCookingTimer.start;
    const timeThreshold = this.deviceSettings.dry_cooking_time_threshold * 60;
    this.debug('Checking dry cooking', timeDiff, timeThreshold);
    if (timeDiff < timeThreshold) {
      return;
    }

    // Trigger and stop interval
    this.triggerDryCooking();
    this.homey.clearInterval(this.dryCookingTimer.interval);
    this.dryCookingTimer.interval = null;
  }

  private startDryCookingTimer(): void {
    if (this.dryCookingTimer !== null) {
      return;
    }

    this.debug('Starting dry cooking timer');
    this.dryCookingTimer = {
      start: Math.round(Date.now() / 1000),
      interval: this.homey.setInterval(() => this.checkDryCookingCondition(), 10 * 1000),
    };
  }

  private clearDryCookingTimer(): void {
    if (this.dryCookingTimer === null) {
      return;
    }

    this.log('Clear dry cooking notification');
    if (this.dryCookingTimer.interval !== null) {
      this.homey.clearInterval(this.dryCookingTimer.interval);
    }
    this.dryCookingTimer = null;
    this.setCapabilityValue('alarm_dry_cooking', false).catch(this.error);
  }

  private triggerDryCooking(): void {
    this.debug('Trigger dry cooking');
    this.setCapabilityValue('alarm_dry_cooking', true).catch(this.error);
  }

  private static parseTemperature(value?: unknown): number | null {
    if (typeof value !== 'number' || value === -32768) {
      return null;
    }

    return Math.round(value / 100);
  }

  private static parsePower(value?: unknown): number | null {
    if (typeof value !== 'number' || value < 0) {
      return null;
    }

    return value;
  }

  private async setupTimeout(): Promise<void> {
    await new Promise((resolve) => this.homey.setTimeout(resolve, 2000));
  }

  getClusterEndpoint(cluster: ClusterSpecification): number | null {
    const value = super.getClusterEndpoint(cluster);

    if (!value) {
      this.error('Endpoint not found', cluster.ID, cluster.NAME);
    }

    return value;
  }
}

module.exports = FireFenceDevice;
