'use strict'

const {ZigBeeDriver} = require('homey-zigbeedriver');

class HzcZigBeeDriver extends ZigBeeDriver {

    getDeviceTriggerCard(flowId) {
        const card = this.homey.flow.getDeviceTriggerCard(flowId)
        if (card) {
            return card
        }
        throw Error(`No ${ flowId } device trigger card found`)
    }

    getActionCard(flowId) {
        const card = this.homey.flow.getActionCard(flowId)
        if (card) return card
        throw Error(`No ${ flowId } action card found`)
    }

    getConditionCard(flowId) {
        const card = this.homey.flow.getConditionCard(flowId)
        if (card) return card
        throw Error(`No ${ flowId } condition card found`)
    }

}

module.exports = HzcZigBeeDriver
