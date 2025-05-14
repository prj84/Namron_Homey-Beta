'use strict'

const {ZCLDataTypes, Cluster} = require('zigbee-clusters')

const ATTRIBUTES = {
    onOff: {
        id: 0,
        type: ZCLDataTypes.bool
    },
    onTime: { id: 16385, type: ZCLDataTypes.uint16 },
    offWaitTime: { id: 16386, type: ZCLDataTypes.uint16 },

    start_up_on_off: {
        id: 0x4003,
        type: ZCLDataTypes.enum8({
            "off": 0,
            "on": 1,
            "toggle": 2,
            "previous value": 0xff
        }),
    }
}

const COMMANDS = {
    setOff: { id: 0 },
    setOn: { id: 1 },
    toggle: { id: 2 },
    offWithEffect: {
        id: 64,
        args: {
            effectIdentifier: ZCLDataTypes.uint8,
            effectVariant: ZCLDataTypes.uint16,
        },
    },
    onWithRecallGlobalScene: { id: 65 },
    onWithTimedOff: {
        id: 66,
        args: {
            onOffControl: ZCLDataTypes.uint8,
            onTime: ZCLDataTypes.uint16,
            offWaitTime: ZCLDataTypes.uint16,
        },
    },
};

class HzcOnOffCluster extends Cluster {
    static get ID() {
        return 6; // The cluster id
    }

    static get NAME() {
        return "onOff"; // The cluster name
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES
    }

    static get COMMANDS() {
        return COMMANDS
    }

}

module.exports = HzcOnOffCluster
