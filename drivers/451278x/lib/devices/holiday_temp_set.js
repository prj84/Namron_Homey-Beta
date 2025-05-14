'use strict'
module.exports = {
    setConfig(device, payload) {
        let payload2 = {}
        payload2['holiday_temp_set'] = parseFloat(payload * 100)
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set vacation_start_date ', payload2)
        }).catch(device.error)
    },
}