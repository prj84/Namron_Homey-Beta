'use strict'
const {CLUSTER, Cluster} = require('zigbee-clusters')
const {
    getOptBaseTime
} = require('./utils');
module.exports = {
    init(device) {
        this.registerCapability(device);
    },
    registerCapability(device) {
        if (!device.hasCapability('t7e_zg_regulator_percentage')) return

        device.registerCapability('t7e_zg_regulator_percentage', CLUSTER.THERMOSTAT, {
            get: 'pIHeatingDemand',
            report: 'pIHeatingDemand',
            reportParser: value => {
                return value / 100
            }, getOpts: {
                getOnStart: true,
                pollInterval: getOptBaseTime,
                getOnOnline: true,
            },
            reportOpts: {
                configureAttributeReporting: {
                    minInterval: 0,
                    maxInterval: 300,
                    minChange: 1,
                },
            },
        })

        device.registerCapabilityListener('t7e_zg_regulator_percentage', async value => {
            let payload = {}
            payload['pIHeatingDemand'] = value * 100
            device.thermostatCluster().writeAttributes(payload).catch(this.error)
            device.setStoreValue('t7e_zg_regulator_percentage', value);
            device.showMessage("Set " + (value * 100) + "%")
        })
    },
}  