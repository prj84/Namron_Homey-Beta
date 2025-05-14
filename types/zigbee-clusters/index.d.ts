/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'zigbee-clusters' {
  import EventEmitter from 'events';
  import {ZigBeeNode} from 'homey';
  import {ClusterSpecification} from 'homey-zigbeedriver';

  function debug(flag?: boolean, namespaces?: string): void;

  export class CLUSTER {
    static BASIC: ClusterSpecification;
    static POWER_CONFIGURATION: ClusterSpecification;
    static DEVICE_TEMPERATURE: ClusterSpecification;
    static IDENTIFY: ClusterSpecification;
    static GROUPS: ClusterSpecification;
    static SCENES: ClusterSpecification;
    static ON_OFF: ClusterSpecification;
    static ON_OFF_SWITCH: ClusterSpecification;
    static LEVEL_CONTROL: ClusterSpecification;
    static ALARMS: ClusterSpecification;
    static TIME: ClusterSpecification;
    static ANALOG_INPUT: ClusterSpecification;
    static ANALOG_OUTPUT: ClusterSpecification;
    static ANALOG_VALUE: ClusterSpecification;
    static BINARY_INPUT: ClusterSpecification;
    static BINARY_OUTPUT: ClusterSpecification;
    static BINARY_VALUE: ClusterSpecification;
    static MULTI_STATE_INPUT: ClusterSpecification;
    static MULTI_STATE_OUTPUT: ClusterSpecification;
    static MULTI_STATE_VALUE: ClusterSpecification;
    static OTA: ClusterSpecification;
    static POWER_PROFILE: ClusterSpecification;
    static POLL_CONTROL: ClusterSpecification;
    static SHADE_CONFIGURATION: ClusterSpecification;
    static DOOR_LOCK: ClusterSpecification;
    static WINDOW_COVERING: ClusterSpecification;
    static THERMOSTAT: ClusterSpecification;
    static PUMP_CONFIGURATION_AND_CONTROL: ClusterSpecification;
    static FAN_CONTROL: ClusterSpecification;
    static COLOR_CONTROL: ClusterSpecification;
    static BALLAST_CONFIGURATION: ClusterSpecification;
    static ILLUMINANCE_MEASUREMENT: ClusterSpecification;
    static ILLUMINANCE_LEVEL_SENSING: ClusterSpecification;
    static TEMPERATURE_MEASUREMENT: ClusterSpecification;
    static PRESSURE_MEASUREMENT: ClusterSpecification;
    static FLOW_MEASUREMENT: ClusterSpecification;
    static RELATIVE_HUMIDITY_MEASUREMENT: ClusterSpecification;
    static OCCUPANCY_SENSING: ClusterSpecification;
    static IAS_ZONE: ClusterSpecification;
    static IAS_ACE: ClusterSpecification;
    static IAS_WD: ClusterSpecification;
    static METERING: ClusterSpecification;
    static ELECTRICAL_MEASUREMENT: ClusterSpecification;
    static DIAGNOSTICS: ClusterSpecification;
    static TOUCHLINK: ClusterSpecification;
  }

  class Cluster extends EventEmitter {
    constructor(endpoint: Endpoint);

    static addCluster(cluster: typeof Cluster): void;

    readAttributes(attributeNames: string[], opts?: { timeout: number }): Promise<{ [attributeName: string]: any }>;

    writeAttributes(attributes: Record<string, unknown>): Promise<{ [attributeName: string]: any }>;

    sendFrame(data: unknown): Promise<void>;
  }

  interface OnOffCluster extends Cluster {
    setOn(): Promise<void>;
    setOff(): Promise<void>;
  }

  class BoundCluster {

  }

  class Endpoint extends EventEmitter {
    clusters: { [id: string]: Cluster };
    bind(clusterName: string, clusterImpl: BoundCluster);
  }

  class ZCLNode extends EventEmitter {
    constructor(node: ZigBeeNode);

    getLogId(endpointId: number, clusterId: number): string;

    handleFrame(endpointId: number, clusterId: number, frame: any, meta: any): Promise<void>;

    endpoints: { [id: string]: Endpoint };
  }

  class ZCLDataTypes {
    static uint8: ZCLDataType;
    static uint16: ZCLDataType;
    static uint32: ZCLDataType;
    static int16: ZCLDataType;
    static int8: ZCLDataType;
    static enum8: ZCLDataType;
    static map8: ZCLDataType;
    static bool: ZCLDataType;
    static data16: ZCLDataType;
    static buffer: ZCLDataType;
  }

  class ZCLDataType {

  }

  class ZCLStruct {

  }
}
