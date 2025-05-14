'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['windowCheck'] = payload;
        device.thermostatCluster().writeAttributes(payload2).catch(this.error)
    }
}  