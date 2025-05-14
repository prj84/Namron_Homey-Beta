module.exports = {
    device: null,
    node: null,
    init: function (device, node) {
        this.startReport(device);
        this.device = device;
        this.node = node;
        return this;
    },
    registerCapability: function () {
        return this;
    },

    startReport: function (device) {
        device.registerCapabilityListener('system_mode',
            async (payload) => {
                this.setConfig(device, payload);
            }
        );
        return this;
    },
    setConfig: function (device, payload) {
        console.log('run_mode SET: ', payload, device.hasCapability(device.thermostat_mode_name));
        if (!device.hasCapability(device.thermostat_mode_name)) {
            return this;
        }
        // if (payload === "off") {
        //     setConfiguratrion(device, null, 40, 1, false, 0);
        // } else if (payload === "heat") {
        //     setConfiguratrion(device, null, 40, 1, false, 1);
        // } else if (payload === "cool") {
        //     setConfiguratrion(device, null, 40, 1, false, 2);
        // }

        let modeStr;
        if ('off' == payload) {
            modeStr = "Off";
        } else if ('heat' === payload) {
            modeStr = "Heat";
        } else if ('cool' === payload) {
            modeStr = "Cool";
        } else if ('eco' === payload) {
            modeStr = "Eco";
        } else if ('auto' === payload) {
            modeStr = "Auto";
        }

        let manuData = Buffer.alloc(2);
        this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_MODE.THERMOSTAT_MODE_SET({
            Level: {
                'No of Manufacturer Data fields': 0,
                Mode: modeStr
            },
            'Manufacturer Data': manuData
        });

        device.homey.settings.set(device.thermostat_mode_name, payload);

    },


}