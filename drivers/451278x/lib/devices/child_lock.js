'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')
const {
    getOptBaseTime
} = require('./utils');

module.exports = {
    init(device) {
        this.registerCapability(device);
    },
    registerCapability(device) {

        if (!device.hasCapability('child_lock')) return;

        device.registerCapability(
            'child_lock',
            CLUSTER.THERMOSTAT_USER_INTERFACE_CONFIGURATION,
            {
                get: 'keypadLockout', report: 'keypadLockout', reportParser: value => {

                    //device.log(`+++++++++ keypadLockout child lock:  `, value)
                    return value === 'level1Lockout'

                },
                getOpts: {
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

        device.registerCapabilityListener('child_lock', async value => {

            //device.log(`child_lock set `, value)

            let payload = {}
            payload['keypadLockout'] = value ? 'level1Lockout' : 'noLockout'

            //device.log('++++++child lock set: ', payload)

            return device.thermostatUserInterfaceConfiguration().
                writeAttributes(payload).
                catch(this.error)

        })


    },

} 