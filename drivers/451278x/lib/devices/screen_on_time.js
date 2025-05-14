'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['screenOnTime'] = (payload).toString()
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('+++++++++set screenOnTime Success payload:', typeof payload, payload)
            device.homey.setTimeout(() => {
                device.readTempOrScreen('screenOnTime')
            }, 1000)
        }).catch(device.error)
    },
}
