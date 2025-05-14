'use strict'
module.exports = {
    async setConfig(device, payload) {

        const settings = device.getSettings();
        if (payload === 'cool' && settings.thermostat_regulator_mode === '6') {
            await device.setWarning("In Regulator Heating, the cool mode cannot be switched.").catch(this.error);
            device.homey.setTimeout(() => {
                device.unsetWarning()
                device.setSettings({systemMode:  settings.systemMode })
            }, 1000)
            return
        }

        device.log('_____________set systemMode ', typeof payload, payload)
        let payload2 = {}
        payload2['systemMode'] = payload
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set systemMode success', typeof payload, payload)
            device.setStoreValue('last_system_mode', payload);
            if (payload !== 'off') {
                device._start()
            }
            // device.homey.setTimeout(() => {
            //     if (payload2['systemMode'] === 'heat') {
            //         device._start()
            //     } else {
            //         device.removeCapability('frost')
            //     }
            // }, 1000)
            // device.updateSetpointTempLimit()
        }).catch(device.error)
    },
}
