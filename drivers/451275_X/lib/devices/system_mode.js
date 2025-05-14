'use strict'
module.exports = {
    setConfig(device, payload) {
        device.log('_____________set systemMode ', typeof payload, payload)
        let payload2 = {}
        payload2['systemMode'] = payload
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set systemMode success', typeof payload, payload)
        }).catch(this.error)
    },
}