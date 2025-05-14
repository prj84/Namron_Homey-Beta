const {setProtection} = require('./utils');

module.exports = {
    device: null,
    node: null,
    pu: 40,
    capability: 'child_lock',
    init: function (device, node) {
        device.appkits['pu' + this.pu] = this;
        this.registerCapability(device, node);
        return this;
    },
    registerCapability: function (device, node) {
        device.registerCapabilityListener(this.capability,
            async (payload) => {
                if (payload === true) {
                    setProtection(device, node, this.pu, 1, false, 1);
                    //setConfiguratrion(device, null, this.pu, 1, false, 1);

                } else {
                    setProtection(device, node, this.pu, 1, false, 0);
                    //setConfiguratrion(device, null, this.pu, 1, false, 0);

                }
            }
        );
        return this;
    },
    startReport: function () {
        return this;
    },
    update: function (device, payload, config) {
        if (!device.hasCapability(this.capability)) return;
        console.log(this.capability, config);
        if (config == 1) {
            device.setCapabilityValue(this.capability, true).catch(this.error);
        } else {
            device.setCapabilityValue(this.capability, false).catch(this.error);
        }
        return this;
    }
} 