'use strict'

const {ZCLDataTypes, Cluster} = require('zigbee-clusters')

const ATTRIBUTES = {
    measuredValue2: {id: 0, type: ZCLDataTypes.int16},
    resistanceValue1: {
        id: 0x0001,
        type: ZCLDataTypes.enum8({
            r0: 0,
            r1: 1,
            r2: 2,
            r3: 3,
            r4: 4,
            r5: 5,
            r6: 6
        }),
    },

    resistanceValue2: {
        id: 0x0002,
        type: ZCLDataTypes.enum8({
            r0: 0,
            r1: 1,
            r2: 2,
            r3: 3,
            r4: 4,
            r5: 5,
            r6: 6
        })
    },

    waterSensorValue: {
        id: 0x0003,
        //type: ZCLDataTypes.map8('water alarm')
        type: ZCLDataTypes.bool
    },

    NTCCalibration1: {
        id: 0x0004,
        type: ZCLDataTypes.int8
    },

    NTCCalibration2: {
        id: 0x0005,
        type: ZCLDataTypes.int8
    },

    waterAlarmRelayAction: {
        id: 0x0006,
        type: ZCLDataTypes.enum8({
            noAction: 0,
            AlarmTurnOff: 1,
            AlarmTurnOn: 2,
            AlarmTurnOffNoAction: 3,
            AlarmTurnOnNoAction: 4,
            NoAlarmTurnOff: 5,
            NoAlarmTurnOn: 6,
        })
    },

    ntc1OperationSelect: {
        id: 0x0007,
        type: ZCLDataTypes.enum8({
            unuse: 0,
            ntc1_1: 1,
            ntc1_2: 2,
            ntc1_3: 3,
            ntc1_4: 4,
        })
    },

    ntc2OperationSelect: {
        id: 0x0008,
        type: ZCLDataTypes.enum8({
            unuse: 0,
            ntc2_1: 1,
            ntc2_2: 2,
            ntc2_3: 3,
            ntc2_4: 4,
        })
    },

    ntc1RelayAutoTemp: {
        id: 0x0009,
        type: ZCLDataTypes.int16
    },

    ntc2RelayAutoTemp: {
        id: 0x000A,
        type: ZCLDataTypes.int16
    },

    overrideOption: {
        id: 0x000B,
        type: ZCLDataTypes.enum8({
            NoPriority: 0,
            WaterAlarmPriority: 1,
            NTCPriority: 2,
        })
    },

    ntc1TempHysterisis: {
        id: 0x000C,
        type: ZCLDataTypes.int8
    },

    ntc2TempHysterisis: {
        id: 0x000D,
        type: ZCLDataTypes.int8
    },

    waterConditionAlarm: {
        id: 0x000E,
        type: ZCLDataTypes.bool
    },

    ntcConditionAlarm: {
        id: 0x000F,
        type: ZCLDataTypes.bool
    },
    isExecuteCondition: {
        id: 0x0010,
        type: ZCLDataTypes.bool
    }
}

const COMMANDS = {
    setClear: {id: 0}
};

class HzcSwitchUserInterfaceConfigurationCluster extends Cluster {

    static get ID() {
        return 0x04E0; // 0x04E0
    }

    static get NAME() {
        return 'switchUserInterfaceConfiguration';
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES;
    }

    static get COMMANDS() {
        return COMMANDS;
    }
}

// Cluster.addCluster(HzcSwitchUserInterfaceConfigurationCluster)

module.exports = HzcSwitchUserInterfaceConfigurationCluster
