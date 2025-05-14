const {setConfiguratrion} = require('./utils');

module.exports = {
    device: null,
    node: null,
    pu: 118,
    capability: 'thermostat_regulator_mode',
    init: function (device, node) {
        device.appkits['pu' + this.pu] = this;
        this.node = node
        this.startReport(device);
        return this;
    },
    registerCapability: function () {
        return this;
    },

    startReport: function (device) {
        device.registerCapabilityListener(this.capability,
            async (payload) => {
                this.setConfig(device, payload);
            }
        );
        return this;
    },
    setConfig: function (device, payload) {
        //button 操作设置
        console.log('regulator BUTTON SET:', payload);

        if (payload === false || payload === '0') {

            //不启用

            const settings = device.getSettings();
            let mode = settings.sensor_mode;
            if (mode === 'p') {
                mode = 'a';
                //device.setSettings({
                //  sensor_mode: mode,
                //});
            }

            //sensor_mode !p
            device.appkits['pu43'].setConfig(device, mode);
            //regulator set 0(off)
            setConfiguratrion(device, null, this.pu, 1, false, 0);

            //device.removeCapability('regulator_percentage');

        } else if (payload === true || payload === '1') {

            if (device.hasCapability(device.thermostat_mode_name)) {
                let cur_thermostat = device.getCapabilityValue(device.thermostat_mode_name);
                if (cur_thermostat === 'cool') {
                    device.showMessage('In cooling mode, the regulator heating cannot be switched.');
                    return;
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

            //sensor_mode
            setConfiguratrion(device, null, 43, 1, false, 6);
            //regulator set min
            setConfiguratrion(device, null, this.pu, 1, false, num);

            device.driver.triggerRegulator(device)

            //device.setClass('socket');

            //device.addCapability('regulator_percentage');

        }


        device.setStoreValue('regulator_mode', payload);
        device.setStoreValue('regulator_mode_changed', true);

        device.showMessage('Please go back and WAIT for reinitializing complete，then click `thermostat` icon to launch application again.');

        device.homey.setTimeout(() => {
            device.onNodeInit({node: this.node})
        }, 2000)

        //device.restartApp();
        //if (!this.hasCapability('regulator_percentage')){

        //}


        //if (!device.hasCapability('app_reset')){
        //  device.addCapability('app_reset');
        //}
    },
    update: function (device, payload, config) {

        console.log('regulator min REV:', payload, config);
        let strConfig = "" + config + "";
        device.setSettings({
            regulator: strConfig,
        });
        console.log('update config: regulator min', strConfig);


    }
}  