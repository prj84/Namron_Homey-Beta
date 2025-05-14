'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        if (payload === 0) {
            payload2['initialBrightness'] = 255
        } else {
            payload2['initialBrightness'] = parseInt((payload * 2.54))
        }

        device.levelControlCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set initialBrightness ', payload, payload2)
        }).catch(device.error)
    },
}