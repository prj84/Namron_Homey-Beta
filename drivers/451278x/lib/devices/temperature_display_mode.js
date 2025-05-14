'use strict'

const {CLUSTER} = require("zigbee-clusters");
const {getOptBaseTime} = require("./utils");
module.exports = {

    // init(device) {
    //     this.registerCapability(device);
    // },
    // registerCapability(device) {
    //
    //     device.registerCapabilityListener('temperatureDisplayMode', async value => {
    //         let payload = {}
    //         payload['temperatureDisplayMode'] = value === 'temperature_display_mode_c' ? 0 : 1
    //
    //         return device.thermostatUserInterfaceConfiguration(). writeAttributes(payload).
    //         catch(this.error)
    //     })
    //
    // },


    async setConfig(device, payload) {

        if (device.hasCapability('sensor_mode')) {
            let mode = device.getCapabilityValue('sensor_mode');
            if (mode !== 'a') {
                await device.setWarning("In Regulator Heating mode, the temperature display mode cannot be switched.").catch(this.error);
                return
            }
        }
        let payload2 = {}

        //regulator set min
        payload2['temperatureDisplayMode'] = payload == 0 ? 'temperature_display_mode_c' : 'temperature_display_mode_f';

        device.thermostatUserInterfaceConfiguration().writeAttributes(payload2).then(() => {
            device.log('+++---temperatureDisplayMode set success', payload2)
            setTimeout(device.readAllMinMaxTemp.bind(device), 1000)
            // device._start()
        }).catch(this.error)
    },

}
