'use strict';
const appkit = require('./lib/');
const {
    updateTempCapOptions, setConfiguratrion
} = require('./lib/devices/utils');

const {ZwaveDevice} = require('homey-zwavedriver');

class JSTAR_Thermostat extends ZwaveDevice {


    thermostat_mode_name = "app_thermostat_mode";
    target_temperature_name = "target_temperature";
    current_measure_temperature = this.homey.settings.get('current_measure_temperature');

    current_target_temperature = this.homey.settings.get('target_temperature') || 20;

    appkits = {};


    async onNodeInit({node}) {
        //this.enableDebug();
        //this.printNode();

        if (this.current_measure_temperature === null) {
            this.current_measure_temperature = 26;
        }

        this.unsetWarning().catch(this.error);


        if (this.hasCapability('app_reset')) {
            this.removeCapability('app_reset').catch(this.error);
        }
        if (this.hasCapability('regulator')) {
            this.removeCapability('regulator').catch(this.error);
        }

        // await this.restartApp();
        appkit.sensor_mode.init(this, node);

        appkit.createSwitch.init(this, node);
        appkit.meters.init(this, node).registerCapability(this).startReport(this);
        appkit.ThermostatMode.init(this, node).registerCapability(this, node).startReport(this);
        appkit.createSetpoint(this, node);
        appkit.adaption.init(this, node);
        appkit.automatically_get_network_time.init(this, node);
        appkit.child_lock.init(this, node);
        appkit.eco_mode.init(this, node);
        appkit.run_mode.init(this, node);
        appkit.window_check.init(this, node);
        appkit.lcd_display_switch.init(this, node);
        appkit.frost.init(this, node);
        appkit.work_days_set.init(this, node);
        appkit.regulator.init(this, node);
        appkit.thermostat_regulator_mode.init(this, node);
        appkit.regulator_percentage.init(this, node);
        appkit.temp_correction.init(this, node);
        appkit.lcd_backlight_wait.init(this, node);
        appkit.lcd_backlight_work.init(this, node);
        appkit.dif_celsius.init(this, node);
        appkit.dif_fahrenheit.init(this, node);
        appkit.frost_celsius.init(this, node);
        appkit.heat_celsius_temp_set.init(this, node);
        appkit.heat_fahrenheit_temp_set.init(this, node);
        appkit.cool_celsius_temp_set.init(this, node);
        appkit.cool_fahrenheit_temp_set.init(this, node);
        appkit.dry.init(this, node);
        appkit.celsius_flt.init(this, node);
        appkit.fahrenheit_flt.init(this, node);
        appkit.week_program_time.init(this, node);
        appkit.week_program_celsius_temp.init(this, node);
        appkit.week_program_fahrenheit_temp.init(this, node);
        appkit.window_door_alarm.init(this, node);
        appkit.work_power.init(this, node);
        appkit.system_mode.init(this, node);
        appkit.Configuration.init(this, node).startReport();
        appkit.Notification.init(this, node).startReport();
        appkit.Protection.init(this, node).startReport();

        this.registerCapabilityListener('button.reset_meter', async () => {
            // Maintenance action button was pressed
            this.meterReset().catch(this.error);

        });

        this.registerCapabilityListener('button.calibrate', async () => {
            // Maintenance action button was pressed, return a promise

        });

        if (this.hasCapability('button.reset_meter')) {
            this.removeCapability('button.reset_meter').catch(this.error)
        }
        if (this.hasCapability('button.calibrate')) {
            this.removeCapability('button.calibrate').catch(this.error)
        }

        if (this.hasCapability('regulator')) {
            this.removeCapability('regulator').catch(this.error);
        }

        this.setStoreValue('regulator_mode_changed', false).catch(this.error);

        await this.restartApp(node);

        appkit.TargetTemperature.init(this, node).registerCapability(this).startReport(this, node);
        appkit.MasureTemperature.init(this, node).registerCapability(this).startReport(this);

        console.log('d', 'device.init end');
    };

    async restartApp(node) {
        try {
            let reg_mode = this.getStoreValue('regulator_mode') || '0';
            console.log('restartApp->w:', reg_mode);

            if (reg_mode === '1') {
                if (!this.hasCapability('regulator_percentage')) {
                    await this.addCapability('regulator_percentage');
                }
                if (this.hasCapability('target_temperature')) {
                    await this.removeCapability('target_temperature');
                    await this.removeCapability('measure_temperature');
                }
                if (this.hasCapability('eco_mode')) {
                    await this.removeCapability('eco_mode');
                }
                if (this.hasCapability('frost')) {
                    await this.removeCapability('frost');
                }
                if (this.hasCapability(this.thermostat_mode_name)) {
                    await this.removeCapability(this.thermostat_mode_name);
                }

                await this.setSettings({
                    sensor_mode: 'p',
                    thermostat_regulator_mode: '1',
                });

                let rp = this.getStoreValue('regulator_percentage') || 0.2;
                this.setCapabilityValue('regulator_percentage', rp).catch(this.error);
                this.driver.triggerRegulator(this)

            } else {
                if (this.hasCapability('regulator_percentage')) {
                    await this.removeCapability('regulator_percentage');
                }
                if (!this.hasCapability(this.thermostat_mode_name)) {
                    await this.addCapability(this.thermostat_mode_name);
                }
                if (!this.hasCapability('target_temperature')) {
                    await this.addCapability('target_temperature');
                    await this.addCapability('measure_temperature');
                }
                if (!this.hasCapability('eco_mode')) {
                    await this.addCapability('eco_mode');
                }
                if (!this.hasCapability('frost')) {
                    await this.addCapability('frost');
                }

                let settings = this.getSettings();
                let mode1 = settings.sensor_mode;
                if (mode1 === 'p') {
                    mode1 = 'f';
                    await this.setSettings({
                        sensor_mode: mode1,
                    });
                }
                await this.setSettings({
                    thermostat_regulator_mode: '0',
                });
            }

            await this.unsetWarning();

        } catch (err) {
            console.log('restartApp ERROR', err);
        }
    }


    refreshUI() {
        let change_ui_runed = this.homey.settings.get('change_ui_runed') || false;
        if (change_ui_runed == false) {
            this.homey.settings.set('change_ui_runed', true);

            let reg_mode = this.getStoreValue('regulator_mode') || '0';
            console.log('refreshUI->w:', reg_mode);
            if (reg_mode === '0') {
                updateTempCapOptions(this, 0, 40, 0.5, this.target_temperature_name);
                updateTempCapOptions(this, -10, 60, 0.5, 'measure_temperature');
                let target_temp = this.homey.settings.get('target_temperature') || 20;
                if (target_temp == 20) {
                    //await this.triggerCapabilityListener('target_temperature', target_temp);
                }
                let mode = this.homey.settings.get(this.thermostat_mode_name) || 'heat';
                this.triggerCapabilityListener(this.thermostat_mode_name, mode);
            }
        }
    }

    async saveSettings(newSettings, changedKeys) {
        changedKeys.forEach(element => {
            console.log("");
            console.log("");
            console.log("");
            console.log("-----------------------config:", element);

            let o = appkit[element];
            if (o != undefined) {
                if (o['setConfig']) {
                    o.setConfig(this, newSettings[element]);
                }
            }
        })
    };


    async onSettings({oldSettings, newSettings, changedKeys}) {
        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed
        // if the settings must not be saved for whatever reason:
        // throw new Error('Your error message');

        console.log(newSettings, changedKeys);

        let week_days_changed = [];
        let rest_days_changed = [];

        changedKeys.forEach(element => {
            if (element.includes('week_days_period')) {
                const period = element.substr('week_days_period_'.length, 1);
                if (week_days_changed.includes(period) == false) {
                    week_days_changed.push(period);
                }

                //0600
                if (element === 'week_days_period_' + period + '_time') {

                }

            }
            if (element.includes('rest_days_period')) {
                const period = element.substr('rest_days_period_'.length, 1);
                if (rest_days_changed.includes(period) == false) {
                    rest_days_changed.push(period);
                }
            }

        });

        //console.log(week_days_changed, rest_days_changed);
        week_days_changed.forEach(element => {
            let h = newSettings['week_days_period_' + element + '_hour'];
            let m = newSettings['week_days_period_' + element + '_minute'];
            let celsius_temp = newSettings['week_days_period_' + element + '_celsius_temp'];
            let fahrenheit_temp = newSettings['week_days_period_' + element + '_fahrenheit_temp'];

            //如工作日 时段1 06:00，则传输0x00 0x00 0x06 0x00。
            let p = element - 1;
            let manuData = Buffer.alloc(4);

            manuData.writeUIntBE(0x00, 0, 1);
            manuData.writeUIntBE(p, 1, 1);
            manuData.writeUIntBE(h, 2, 1);
            manuData.writeUIntBE(m, 3, 1);

            console.log(element, h, m, celsius_temp, fahrenheit_temp);
            console.log(manuData);

            appkit['week_program_time'].setConfig(this, manuData);


            let manuData2 = Buffer.alloc(4);
            manuData2.writeUIntBE(0x00, 0, 1);
            manuData2.writeUIntBE(p, 1, 1);
            manuData2.writeUInt16BE(celsius_temp * 10, 2, 2);
            console.log(manuData2);
            appkit['week_program_celsius_temp'].setConfig(this, manuData2);

            let manuData3 = Buffer.alloc(4);
            manuData3.writeUIntBE(0x00, 0, 1);
            manuData3.writeUIntBE(p, 1, 1);
            manuData3.writeUInt16BE(fahrenheit_temp * 10, 2, 2);
            console.log(manuData3);
            appkit['week_program_fahrenheit_temp'].setConfig(this, manuData3);


        });
        rest_days_changed.forEach(element => {
            let h = newSettings['rest_days_period_' + element + '_hour'];
            let m = newSettings['rest_days_period_' + element + '_minute'];
            let celsius_temp = newSettings['rest_days_period_' + element + '_celsius_temp'];
            let fahrenheit_temp = newSettings['rest_days_period_' + element + '_fahrenheit_temp'];

            //如休息日 时段1 06:00，则传输0x00 0x00 0x06 0x00。
            let p = element - 1;
            let manuData = Buffer.alloc(4);

            manuData.writeUIntBE(0x01, 0, 1);
            manuData.writeUIntBE(p, 1, 1);
            manuData.writeUIntBE(h, 2, 1);
            manuData.writeUIntBE(m, 3, 1);

            console.log(element, h, m, celsius_temp, fahrenheit_temp);
            console.log(manuData);

            appkit['week_program_time'].setConfig(this, manuData);


            let manuData2 = Buffer.alloc(4);
            manuData2.writeUIntBE(0x01, 0, 1);
            manuData2.writeUIntBE(p, 1, 1);
            manuData2.writeUInt16BE(celsius_temp * 10, 2, 2);
            console.log(manuData2);
            appkit['week_program_celsius_temp'].setConfig(this, manuData2);

            let manuData3 = Buffer.alloc(4);
            manuData3.writeUIntBE(0x01, 0, 1);
            manuData3.writeUIntBE(p, 1, 1);
            manuData3.writeUInt16BE(fahrenheit_temp * 10, 2, 2);
            console.log(manuData3);
            appkit['week_program_fahrenheit_temp'].setConfig(this, manuData3);


        });

        this.saveSettings(newSettings, changedKeys);

    }


    //修改温度单位
    async toggleTempUnit(node, unit) {
        let manuData = Buffer.alloc(2);
        manuData.writeUInt16BE(unit);
        await node.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
            'Parameter Number': 23,
            Level: {Size: 1, Default: false},
            'Configuration Value': manuData
        });
        console.log('888888888888:修改温度单位');
    }

    async showMessage(msg) {
        console.log('show message: ', msg);
        await this.setWarning(msg);
        await this.unsetWarning();
    }

    async turnFrostRunListener(args, state) {
        this.log('zv_HHHHHHHHHH++++++++++++++++++++++', args.frost,)

        if (args.frost === true) {
            let tm = this.getCapabilityValue(this.thermostat_mode_name) || {};
            console.log('Frost .... check thermostat_mode=', tm);
            if (tm !== 'heat') {
                this.setCapabilityValue('frost', false).catch(this.error);
                await this.showMessage('Frost must run in `heat` mode.');
                return;
            }
            await setConfiguratrion(this, null, 10, 1, false, 1);
            this.setCapabilityValue('frost', true).catch(this.error);
            this.driver.triggerMyFlow(this, true)
        } else {
            await setConfiguratrion(this, null, 10, 1, false, 0);
            this.setCapabilityValue('frost', false).catch(this.error);
            this.driver.triggerMyFlow(this, false)
        }
    }
}

module.exports = JSTAR_Thermostat;