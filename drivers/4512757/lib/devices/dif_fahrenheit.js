const {setConfiguratrion} = require('./utils');

module.exports = {
    device: null,
    node: null,
    pu: 135,
    capability: 'dif_fahrenheit',
    init: function (device, node) {
        device.appkits['pu' + this.pu] = this;
        this.startReport(device);
        return this;
    },
    registerCapability: function () {
        return this;
    },

    startReport: function (device) {
        device.registerCapabilityListener(this.capability,
            async (payload) => {
                let runModeCapValue = device.getCapabilityValue(this.capability);
                console.log('dif_fahrenheit SET:', payload, runModeCapValue);
                setConfiguratrion(device, null, this.pu, 2, false, payload);
            }
        );
        return this;
    },
    setConfig: function (device, payload) {
        console.log('dif_fahrenheit SET:', payload);
        setConfiguratrion(device, null, this.pu, 2, false, payload);
    },
    update: function (device, payload, config) {
        if (!device.hasCapability(this.capability)) return;
        let runModeCapValue = device.getCapabilityValue(this.capability);
        console.log('dif_fahrenheit REV:', runModeCapValue, config);
        device.setCapabilityValue(this.capability, config).catch(this.error);
    }
}  