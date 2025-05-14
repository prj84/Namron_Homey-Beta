'use strict'

const {ZCLDataTypes, Cluster} = require('zigbee-clusters')

const ATTRIBUTES = {
    currentLevel: {id: 0, type: ZCLDataTypes.uint8},
    remainingTime: {id: 1, type: ZCLDataTypes.uint16},
    onOffTransitionTime: {id: 16, type: ZCLDataTypes.uint16},
    onLevel: {id: 17, type: ZCLDataTypes.uint8},
    onTransitionTime: {id: 18, type: ZCLDataTypes.uint16},
    offTransitionTime: {id: 19, type: ZCLDataTypes.uint16},
    defaultMoveRate: {id: 20, type: ZCLDataTypes.uint8},

    initialBrightness: {id: 0x0011, type: ZCLDataTypes.uint8},
    minimumBrightness: {id: 0xA000, type: ZCLDataTypes.uint8},
    screenConstantTime: {id: 0xA001, type: ZCLDataTypes.uint8},
    backlight: {id: 0xA002, type: ZCLDataTypes.uint8},
    outEdge: {
        id: 0xB000,
        type: ZCLDataTypes.enum8({
            trailingEdge: 0,
            LeadingEdge: 1,
        })
    }
};

const COMMANDS = {
    moveToLevel: {
        id: 0,
        args: {
            level: ZCLDataTypes.uint8,
            transitionTime: ZCLDataTypes.uint16,
        },
    },
    move: {
        id: 1,
        args: {
            moveMode: ZCLDataTypes.enum8({
                up: 0,
                down: 1,
            }),
            rate: ZCLDataTypes.uint8,
        },
    },
    step: {
        id: 2,
        args: {
            mode: ZCLDataTypes.enum8({
                up: 0,
                down: 1,
            }),
            stepSize: ZCLDataTypes.uint8,
            transitionTime: ZCLDataTypes.uint16,
        },
    },
    stop: {id: 3},
    moveToLevelWithOnOff: {
        id: 4,
        args: {
            level: ZCLDataTypes.uint8,
            transitionTime: ZCLDataTypes.uint16,
        },
    },
    moveWithOnOff: {
        id: 5,
        args: {
            moveMode: ZCLDataTypes.enum8({
                up: 0,
                down: 1,
            }),
            rate: ZCLDataTypes.uint8,
        },
    },
    stepWithOnOff: {
        id: 6,
        args: {
            mode: ZCLDataTypes.enum8({
                up: 0,
                down: 1,
            }),
            stepSize: ZCLDataTypes.uint8,
            transitionTime: ZCLDataTypes.uint16,
        },
    },
    stopWithOnOff: {id: 7},
};

class LevelControlCluster extends Cluster {
    static get ID() {
        return 8;
    }

    static get NAME() {
        return 'levelControl';
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES;
    }

    static get COMMANDS() {
        return COMMANDS;
    }
}

module.exports = LevelControlCluster
