'use strict'
module.exports = {
    async setConfig(device, payload) {
        if (payload === false || payload === '0') {
            //不启用
            const settings = device.getSettings();
            let mode = settings.sensor_mode;
            if (mode === 'p') {
                mode = 'a';
            }

            let payload2 = {}
            //sensor_mode !p
            payload2['sensorMode'] = mode;
            //regulator set 0(off)
            payload2['regulator'] = parseInt(payload);

            device.thermostatCluster().writeAttributes(payload2).catch(this.error)

        } else if (payload === true || payload === '6') {

            let settings = device.getSettings();

            if (settings.systemMode === 'cool') {
                const val = settings.countdown_set
                console.log("thermostat_regulator_mode", val);
                await device.setWarning("In cooling mode, the regulator heating cannot be switched.").catch(this.error);
                device.homey.setTimeout(() => {
                    device.unsetWarning()
                    device.setSettings({thermostat_regulator_mode:  val })
                }, 1000)
                return
            }

            let payload2 = {}
            //sensor_mode
            payload2['sensorMode'] = 'p'

            //regulator set min
            payload2['regulator'] = parseInt(payload);

            device.thermostatCluster().writeAttributes(payload2).then(() => {
                device.driver.triggerRegulator(device)
            }).catch(this.error)

        }
        // device.showMessage('The regulator mode has changed. Please return and trigger the switch to reboot the device.');
        // await device.setUnavailable();

        // device.onoffCluster().setOff()
        //
        // device.homey.setTimeout(() => {
        //     // device._start()
        //     device.onoffCluster().setOn()
        // }, 3000)

    },

}
