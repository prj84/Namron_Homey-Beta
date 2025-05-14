'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['minimumBrightness'] = payload
        device.levelControlCluster().writeAttributes(payload2).then(() => {
        }).catch(device.error)
    },
}