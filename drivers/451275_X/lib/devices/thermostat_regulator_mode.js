'use strict'
const {
    TIP_CHANGED
} = require('./utils');
module.exports = {

    async setConfig(device, payload) {
        console.log('regulator Mode SET:', payload);

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
            payload2['regulator'] = 0;

            device.thermostatCluster().writeAttributes(payload2).catch(this.error)

        } else if (payload === true || payload === '1') {

            if (device.hasCapability('t7e_zg_thermostat_mode')) {
                let cur_thermostat = device.getCapabilityValue('t7e_zg_thermostat_mode');
                if (cur_thermostat === 'cool') {
                    await device.setWarning("In cooling mode, the regulator heating cannot be switched.").catch(this.error);
                    device.unsetWarning().catch(this.error);
                    return
                }
            }

            //set p mode: 移到切换中设置
            //device.setSettings({
            //  sensor_mode: 'p',
            //});

            const settings = device.getSettings();
            let reg = settings.regulator;
            let num = reg.replace('min', '');
            num = num.trim();
            if (num === 'OFF') {
                num = '0';
            }


            let payload2 = {}
            //sensor_mode
            payload2['sensorMode'] = 'p'

            //regulator set min
            payload2['regulator'] = parseInt(num);

            device.thermostatCluster().writeAttributes(payload2).then(() => {
                device.driver.triggerRegulator(device)
            }).catch(this.error)

        }

        device.setStoreValue('regulator_mode', payload);
        device.setStoreValue('regulator_mode_changed', true);
        await device.showMessage(TIP_CHANGED);


    },

}  