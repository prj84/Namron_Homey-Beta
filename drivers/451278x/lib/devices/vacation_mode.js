'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['vacation_mode'] = payload === 'true'
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set vacation_mode ', payload2)
        }).catch(device.error)
    },
}