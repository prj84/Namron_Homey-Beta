import Homey, {Device} from 'homey';
import {ZigBeeDevice, ZigbeeDeviceInitPayload} from 'homey-zigbeedriver';
import {CLUSTER, Cluster} from 'zigbee-clusters';
import {TuyaCommunicator, TuyaDataPointPackage} from './TuyaCommunicator';
import TuyaSpecificCluster from './TuyaSpecificCluster';

enum ThermostatDataPoint {
  Switch = 1, // Bool
  Mode = 2, // Enum [0,1,2,3,4] 0 = Manual, 1 = Home, 2 = Away, 3 = Auto, 4 = Manual?
  TempSet = 16, // Value Range: 5-35, Pitch: 1, Scale: 0, Unit: ℃
  TempCurrent = 24, // Report only, Value Range: 0-99,  Pitch: 1, Scale: 0, Unit: ℃
  TempCorrection = 28, // Value Range: -9-9, Pitch: 1, Scale: 0, Unit: ℃
  ChildLock = 30, // Bool
  TempFloor = 101, // Report only, Value Range: 0-99, Pitch: 1, Scale: 0, Unit: ℃
  SensorType = 102, // Enum [0,1,2]
  TempActivate = 103, // Value Range: 1-9, Pitch: 1, Scale: 0, Unit: ℃
  LoadStatus = 104, // Report only, Bool
  TempProgram = 105, // Raw
  OpenWindow = 106, // Bool
  MaxProtectTemper = 107, // Value Range: 20-95, Pitch: 1, Scale: 0, Unit: ℃
  DeviceType = 108, // Enum [0,1] 0 = Regulator, 1 = Thermostat
  RegulatorCycleTime = 109, // Enum [0,1,2,3] 0 = 30, 1 = 60, 2 = 90, 3 = 120
  RegulatorDuty = 110, // Value range: 5-100, Pitch: 5, Unit: %
  LoadCurrent = 120, // Values range: 0-2000, Pitch: 1, Unit: A
  LoadVoltage = 121, // Values range: 0-25000, Pitch: 1, Unit: V
  LoadPower = 122, // Values range: 0-500000, Pitch: 1, Unit: W
  LoadEnergy = 123, // Values range: 0-1000000, Pitch: 1, Unit: KWH
  SerialNumber = 199, // Report only, String
}

export interface ThermostatDeviceInstance extends Device {
  setMode(mode: number): Promise<void>;

  setSensorType(type: number): Promise<void>;

  setThermostatOnOff(locked: boolean): Promise<void>;

  setChildLock(locked: boolean): Promise<void>;
}

export type ThermostatSettings = {
  loadPower?: number;
  regulatorMode?: boolean;
  regulatorCycleTime?: string;
}

export type ThermostatSettingsArguments = {
  oldSettings: ThermostatSettings,
  newSettings: ThermostatSettings;
  changedKeys: Array<(keyof ThermostatSettings) | string>
};

export default class TuyaThermostatDevice extends ZigBeeDevice implements ThermostatDeviceInstance {
  static INTERNAL_TEMP = 'internal_temp';
  static FLOOR_TEMP = 'floor_temp';

  protected powerEstimate = false;
  protected regulatorSupport = false;

  private tuya!: TuyaCommunicator;
  private onSettingsPending = false;

  async onNodeInit(payload: ZigbeeDeviceInitPayload): Promise<void> {
    //if (Homey.env.DEBUG === '1') {
    //  this.enableDebug();
    //}

    // Set up the tuya cluster communicator
    const tuyaCluster: Cluster = payload.zclNode
      .endpoints[this.getClusterEndpoint(TuyaSpecificCluster)!] // eslint-disable-line @typescript-eslint/no-non-null-assertion
      .clusters[TuyaSpecificCluster.NAME];
    this.tuya = new TuyaCommunicator(this, tuyaCluster);

    // Remove old capabilities
    await this.ensureCapabilityRemoved('tuya_screen_status');
    await this.ensureCapabilityRemoved('tuya_thermostat_onoff');

    // Register new capabilities
    await this.addMissingCapabilities([
      'onoff',
      'tuya_thermostat_sensor_type',
      'measure_temperature.air',
      'measure_temperature.floor',
      'tuya_thermostat_load_status',
      'measure_power',
    ]);

    // Ensure correct capabilities depending on regulator setting
    if (this.regulatorSupport) {
      await this.configureRegulatorMode(this.getSetting('regulatorMode'));
    }

    // Register the integrations
    this.registerCapabilityListeners();
    this.registerDataPointListener();

    // Read from the basic cluster, to trigger the device into thinking we are Tuya
    if (this.isFirstInit()) {
      await payload.zclNode
        .endpoints[this.getClusterEndpoint(CLUSTER.BASIC)!] // eslint-disable-line @typescript-eslint/no-non-null-assertion
        .clusters[CLUSTER.BASIC.NAME]
        .readAttributes(['manufacturerName', 'zclVersion', 'appVersion', 'modelId', 'powerSource', 'attributeReportingStatus']);
    }

    // Set up the time functionality
    this.setupTimeFunctionality();
  }

  public async setMode(mode: number): Promise<void> {
    mode = Math.min(2, Math.max(0, mode));
    this.log('Setting new thermostat mode to', mode);
    await this.tuya.writeEnum(ThermostatDataPoint.Mode, mode);
  }

  public async setSensorType(type: number): Promise<void> {
    type = Math.min(2, Math.max(0, type));
    this.log('Setting new sensor type to', type);
    await this.tuya.writeEnum(ThermostatDataPoint.SensorType, type);
  }

  public async setThermostatOnOff(status: boolean): Promise<void> {
    this.log('Setting thermostat on off to', status);
    await this.tuya
      .writeBool(ThermostatDataPoint.Switch, status)
      .catch(this.error);
  }

  public async setChildLock(locked: boolean): Promise<void> {
    this.log('Setting child lock to', locked);
    await this.tuya.writeBool(ThermostatDataPoint.ChildLock, locked);
  }

  private registerCapabilityListeners(): void {
    this.registerCapabilityListener('onoff', async (newValue: boolean) => {
      await this.setThermostatOnOff(newValue);
    });

    this.registerCapabilityListener('target_temperature', async (newValue: number) => {
      const rangeLimitedValue = Math.min(35, Math.max(5, Math.round(newValue)));
      this.log('Setting new temperature to', rangeLimitedValue);
      await this.tuya.writeData32(ThermostatDataPoint.TempSet, rangeLimitedValue);
    });

    this.registerCapabilityListener('tuya_regulator_duty', async (newValue: number) => {
      this.log('Setting new duty cycle to', newValue);
      await this.tuya.writeData32(ThermostatDataPoint.RegulatorDuty, newValue);
    })

    this.registerCapabilityListener('tuya_thermostat_mode', async (newValue: string) => {
      await this.setMode(Number(newValue));
    });

    this.registerCapabilityListener('tuya_thermostat_sensor_type', async (newValue: string) => {
      await this.setSensorType(Number(newValue));
    });

    this.registerCapabilityListener('tuya_child_lock', async (newValue: boolean) => {
      await this.setChildLock(newValue);
    });
  }

  private async configureRegulatorMode(regulatorMode: boolean): Promise<void> {
    if (regulatorMode) {
      await this.ensureCapabilityAvailable('tuya_regulator_duty');
      await this.ensureCapabilityRemoved('target_temperature');
    } else {
      await this.ensureCapabilityRemoved('tuya_regulator_duty');
      await this.ensureCapabilityAvailable('target_temperature');
    }
  }

  async onSettings(settings: ThermostatSettingsArguments): Promise<void> {
    this.onSettingsPending = true;
    try {
      if (settings.changedKeys.includes('loadPower') && this.getCapabilityValue('tuya_thermostat_load_status')) {
        await this.setCapabilityValue('measure_power', settings.newSettings.loadPower);
      }

      if (settings.changedKeys.includes('regulatorMode')) {
        await this.tuya.writeEnum(ThermostatDataPoint.DeviceType, settings.newSettings.regulatorMode ? 0 : 1);
        await this.configureRegulatorMode(!!settings.newSettings.regulatorMode);
      }

      if (settings.changedKeys.includes('regulatorCycleTime') && settings.newSettings.regulatorCycleTime) {
        await this.tuya.writeEnum(ThermostatDataPoint.RegulatorCycleTime, Number(settings.newSettings.regulatorCycleTime));
      }
    } finally {
      this.onSettingsPending = false;
    }
  }

  private registerDataPointListener(): void {
    this.tuya.cluster.on('tuya.dataResponse', (args: TuyaDataPointPackage) => this.dataPointHandler(args));
    // The newer thermostat uses data report instead of dataResponse (as it should)
    this.tuya.cluster.on('tuya.dataReport', (args: TuyaDataPointPackage) => this.dataPointHandler(args));
  }

  private dataPointHandler(args: TuyaDataPointPackage): void {
    this.debug('Received data response', args.dataPoint, args.data);
    switch (args.dataPoint) {
      case ThermostatDataPoint.Switch:
        this
          .setCapabilityValue('onoff', this.tuya.readBool(args.data))
          .catch(this.error);
        break;
      case ThermostatDataPoint.Mode: {
        let mode = this.tuya.readEnum(args.data);
        if (mode > 3) {
          mode = 0;
        }
        this
          .setCapabilityValue('tuya_thermostat_mode', String(mode))
          .catch(this.error);
        break;
      }
      case ThermostatDataPoint.TempSet: {
        if (!this.hasCapability('target_temperature')) {
          break;
        }

        let targetTemp: number | null = this.tuya.readData32(args.data);
        if (targetTemp === 0x8000 || targetTemp === 0xFFFF) {
          targetTemp = null
        }

        this
          .setCapabilityValue('target_temperature', targetTemp)
          .catch(this.error);
        break;
      }
      case ThermostatDataPoint.TempCurrent: {
        let internalTemp: number|null = this.tuya.readData32(args.data);
        if (internalTemp === 1000 || internalTemp === 0x8000 || internalTemp === 0xFFFF) {
          internalTemp = null
        }

        this.setStoreValue(TuyaThermostatDevice.INTERNAL_TEMP, internalTemp).catch(this.error);

        this
          .setCapabilityValue('measure_temperature.air', internalTemp)
          .catch(this.error);

        if (!this.isFloorSensorMode()) {
          this
            .setCapabilityValue('measure_temperature', internalTemp)
            .catch(this.error);
        }

        break;
      }
      case ThermostatDataPoint.SensorType: {
        const newMode = String(this.tuya.readEnum(args.data));
        if (this.getCapabilityValue('tuya_thermostat_sensor_type') !== newMode) {
          const newTemp = this.getStoreValue(newMode === '1' ? TuyaThermostatDevice.FLOOR_TEMP : TuyaThermostatDevice.INTERNAL_TEMP);
          if (newTemp) {
            this.setCapabilityValue('measure_temperature', newTemp).catch(this.error);
          }
        }

        this
          .setCapabilityValue('tuya_thermostat_sensor_type', newMode)
          .catch(this.error);

        break;
      }
      case ThermostatDataPoint.TempFloor: {
        let floorTemp: number|null = this.tuya.readData32(args.data);
        if (floorTemp === 1000 || floorTemp === 0x8000 || floorTemp === 0xFFFF) {
          floorTemp = null
        }

        this.setStoreValue(TuyaThermostatDevice.FLOOR_TEMP, floorTemp).catch(this.error);

        this
          .setCapabilityValue('measure_temperature.floor', floorTemp)
          .catch(this.error);

        if (this.isFloorSensorMode()) {
          this
            .setCapabilityValue('measure_temperature', floorTemp)
            .catch(this.error);
        }

        break;
      }
      case ThermostatDataPoint.ChildLock:
        this
          .setCapabilityValue('tuya_child_lock', this.tuya.readBool(args.data))
          .catch(this.error);
        break;
      case ThermostatDataPoint.LoadStatus: {
        const loadStatus = this.tuya.readBool(args.data);
        this.setCapabilityValue('tuya_thermostat_load_status', loadStatus).catch(this.error);

        if (this.powerEstimate) {
          if (this.getSetting('loadPower') === 0) {
            // Set to null when the settings hasn't been configured
            this.setCapabilityValue('measure_power', null).catch(this.error);
          } else {
            this
              .setCapabilityValue('measure_power', loadStatus ? this.getSetting('loadPower') : 0)
              .catch(this.error);
          }
        }
        break;
      }
      case ThermostatDataPoint.DeviceType: {
        if (this.onSettingsPending) {
          break;
        }

        const regulatorType = this.tuya.readEnum(args.data) === 0;
        this
          .setSettings({regulatorType})
          .catch(this.error);
        this.configureRegulatorMode(regulatorType).catch(this.error);
        break;
      }
      case ThermostatDataPoint.RegulatorCycleTime:
        if (this.onSettingsPending) {
          break;
        }

        this
          .setSettings({regulatorCycleTime: String(this.tuya.readEnum(args.data))})
          .catch(this.error);
        break;
      case ThermostatDataPoint.RegulatorDuty:
        if (!this.hasCapability('tuya_regulator_duty')) {
          break;
        }

        this
          .setCapabilityValue('tuya_regulator_duty', this.tuya.readData32(args.data))
          .catch(this.error);
        break;
      case ThermostatDataPoint.LoadCurrent:
        this
          .setCapabilityValue('measure_current', this.tuya.readData32(args.data) / 10)
          .catch(this.error);
        break;
      case ThermostatDataPoint.LoadVoltage:
        this
          .setCapabilityValue('measure_voltage', this.tuya.readData32(args.data))
          .catch(this.error);
        break;
      case ThermostatDataPoint.LoadPower:
        this
          .setCapabilityValue('measure_power', this.tuya.readData32(args.data))
          .catch(this.error);
        break;
      case ThermostatDataPoint.LoadEnergy:
        this
          .setCapabilityValue('meter_power', this.tuya.readData32(args.data) / 100)
          .catch(this.error);
        break;
      default:
        this.debug('Unhandled datapoint', args.dataPoint, args.data);
    }
  }

  private setupTimeFunctionality(): void {
    // Schedule time update some time after init, to allow the module to wake
    this.homey.setTimeout(() => {
      this.tuya.setTime(this.homey.clock.getTimezone()).catch(this.error);

      // Update it regularly from now on
      this.homey.setInterval(() => {
        this.tuya.setTime(this.homey.clock.getTimezone()).catch(this.error);
      }, 60 * 60 * 1000); // Every hour
    }, 10000); // 10 seconds

    this.homey.clock.on('timezoneChange', (timezone) => {
      this.tuya.setTime(timezone).catch(this.error);
    });
  }

  private isFloorSensorMode(): boolean {
    return Number(this.getCapabilityValue('tuya_thermostat_sensor_type')) === 1;
  }

  private async addMissingCapabilities(capabilities: string[]): Promise<void> {
    for (const capability of capabilities) {
      await this.ensureCapabilityAvailable(capability);
    }
  }

  private async ensureCapabilityAvailable(capability: string): Promise<void> {
    if (this.hasCapability(capability)) {
      return;
    }

    await this.addCapability(capability);
  }

  private async ensureCapabilityRemoved(capability: string): Promise<void> {
    if (!this.hasCapability(capability)) {
      return;
    }

    await this.removeCapability(capability);
  }
}
