const {setConfiguratrion} = require('./utils');

module.exports = {
    device: null,
    node: null,
    pu: 127,
    capability: 'regulator_percentage',
    init: function (device, node) {
        device.appkits['pu' + this.pu] = this;
        this.startReport(device);
        return this;
    },
    registerCapability: function () {
        return this;
    },

    startReport: function (device) {
        try {
            device.registerCapabilityListener(this.capability, async (payload) => {
                try {
                    console.log('regulator_percentage SET 2:', payload);
                    await setConfiguratrion(device, null, this.pu, 4, false, payload * 100);
                    device.setStoreValue('regulator_percentage', payload * 100);
                    device.showMessage('Set ' + payload * 100 + '%');
                } catch (error) {
                    console.error('Error in capabilityListener:', error);
                }
            });

            device.configurationGet({index: this.pu})
            .then((payload) => {
                try {
                    device.log('+++++++++++++++++++configurationGet', payload);
                    const mode = payload['Configuration Value (Raw)'];
                    if (Buffer.isBuffer(mode)) {
                        const vNew = mode.readIntBE(payload.Level.Size - 1, 1);
                        device.log('+++++++++++++++++++vNew', vNew);
                        device.setStoreValue('regulator_percentage', vNew / 100);
                    }
                } catch (error) {
                    console.error('Error in configurationGet:', error);
                }
            })
            .catch((error) => {
                console.error('Error in configurationGet promise:', error);
            });

            return this;
        } catch (error) {
            console.error('Error in startReport:', error);
            return this;
        }
    },
    setConfig: function (device, payload) {
        this.log('++++++++++++++++++setConfig', payload)

        setConfiguratrion(device, null, this.pu, 4, false, payload * 100)
        .then(result => {
            // Handle the result if needed
            console.log('Operation successful:', result);
        })
        .catch(error => {
            // Handle the rejection
            console.error('Error:', error);
        });
    },

    update: async function (device, payload, config) {
        try {
            if (!device.hasCapability('regulator_percentage')) return;

            let runModeCapValue = device.getCapabilityValue('regulator_percentage');
            let v = (Math.round(config / 10) * 10).toFixed(0);
            console.log('regulator_percentage REV:', runModeCapValue, config, v);
            let vNew = parseInt(v, 10);
            device.setStoreValue('regulator_percentage', vNew / 100);
            device.setCapabilityValue('regulator_percentage', vNew / 100).catch(this.error);
        } catch (error) {
            console.error('Error in update function:', error);
        }
    }
}  