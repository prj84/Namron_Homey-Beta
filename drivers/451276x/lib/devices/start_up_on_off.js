'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['start_up_on_off'] = payload
        device.onoffCluster(1).writeAttributes(payload2).then(() => {
            device.log('_____________set start_up_on_off ', payload, payload2)
        }).catch(device.error)
    },
}