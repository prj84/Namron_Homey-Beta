'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['auto_time'] = payload === 'true'
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set auto_time ', typeof payload, payload2)
        }).catch(device.error)
    },
}