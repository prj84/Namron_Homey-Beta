'use strict'
module.exports = {
    setConfig(device, payload) {
        let settings = device.getSettings();
        if (settings.systemMode === 'cool') {
            const val = settings.countdown_set
            console.log("countdown_set", val);
            device.setWarning("In cooling mode, the countdown cannot be set.").catch(this.error);
            device.homey.setTimeout(() => {
                device.unsetWarning()
                device.setSettings({countdown_set:  val })
            }, 1000)
            return
        }


        let payload2 = {}
        payload2['countdown_set'] = (payload).toString()
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('+++++++++set countdown_set Success payload:', typeof payload, payload)
        }).catch(device.error)
    },
}
