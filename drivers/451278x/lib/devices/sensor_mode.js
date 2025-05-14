'use strict'
const {CLUSTER, Cluster} = require('zigbee-clusters')
const {
    getOptBaseTime, TIP_CHANGED
} = require('./utils');
module.exports = {
    init(device) {
        this.registerCapability(device)
    },
    registerCapability(device) {
        if (!device.hasCapability('t7e_zg_sensor_mode')) return;
        device.setCapabilityValue('t7e_zg_sensor_mode', device.getStoreValue('sensor_mode') || 'a').catch(this.error)
        device.registerCapability('t7e_zg_sensor_mode', CLUSTER.THERMOSTAT, {
            get: 'sensorMode', report: 'sensorMode', reportParser: value => {
                return value
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
    },


    async setConfig(device, payload) {
        console.log('sensor mode SET:', payload);
        const settings = device.getSettings();

        if (payload === 'p' && settings.systemMode === 'cool') {
            await device.setWarning("In cooling mode, the p mode cannot be switched.").catch(this.error);
            device.homey.setTimeout(() => {
                device.unsetWarning()
                device.setSettings({sensor_mode:  settings.sensor_mode })
            }, 1000)
            return
        }

        let payload2 = {}

        payload2['sensorMode'] = payload;
        device.log('##############kkkkkkkk000000000,', payload2)

        try {
            device.thermostatCluster().writeAttributes(payload2)
        } catch (err) {
            //device.log(err)
        }


        let mode1 = device.getCapabilityValue('t7e_zg_sensor_mode');

        if (device.hasCapability('t7e_zg_sensor_mode')) {
            device.setCapabilityValue('t7e_zg_sensor_mode', payload).catch(this.error)
        }

        if (mode1 !== payload && (mode1 === 'p' || payload === 'p')) {

            device.setStoreValue('regulator_mode_changed', true);

            // await device.showMessage(TIP_CHANGED);


        }


    },
}
