'use strict';

const {ZigBeeDevice} = require("homey-zigbeedriver");
const {CLUSTER, Cluster} = require('zigbee-clusters')

const appkit = require('./lib/');

const destructConstProps = function ({ID, NAME, ATTRIBUTES, COMMANDS}) {
    return Object.freeze({
        ID, NAME, ATTRIBUTES, COMMANDS,
    });
}

const HzcThermostatCluster = require('../../lib/SrThermostatCluster')
const HzcThermostatUserInterfaceConfigurationCluster =
    require('../../lib/SrThermostatUserInterfaceConfigurationCluster')
Cluster.addCluster(HzcThermostatCluster)
Cluster.addCluster(HzcThermostatUserInterfaceConfigurationCluster)

CLUSTER['THERMOSTAT_USER_INTERFACE_CONFIGURATION'] =
    destructConstProps(HzcThermostatUserInterfaceConfigurationCluster)

const getInt16 = function (number) {
    const int16 = new Int16Array(1)
    int16[0] = number
    return int16[0]
}

const {
    getOptBaseTime, TIP_CHANGED
} = require('./lib/devices/utils');


class t7e_zg_thermostat extends ZigBeeDevice {

    onEndDeviceAnnounce() {
    }

    onDeleted() {
        console.log('delete t7e')
        super.onDeleted();
    }

    async onNodeInit({zclNode, node}) {
        super.onNodeInit({zclNode: zclNode, node: node})
        this.disableDebug()

        this.meter_multiplier = 0.001;
        this.power_multiplier = 0.1;
        this.target_temp_setpoint_min = 5
        this.target_temp_setpoint_max = 40
        this.target_temp_timer = null
        await this._start()
        await this._onHandlerReport()
    };

    async _start() {
        this.setAvailable().catch(this.error);

        await this.thermostatCluster().readAttributes(
            ['sensorMode', 'systemMode', 'thermostatRunningMode',
                'absMinHeatSetpointLimit', 'absMaxHeatSetpointLimit',
                'absMinCoolSetpointLimit', 'absMaxCoolSetpointLimit']
        ).then(value => {
            this.log(`++++++ APP start thermostat = `, value)

            if (value.hasOwnProperty('systemMode')) {
                this._setModeUI(value['systemMode'])
            }
            if (value.hasOwnProperty('thermostatRunningMode')) {
                this._setModeUI(value['thermostatRunningMode'])
            }

            if (value.hasOwnProperty('sensorMode')) {
                let sensorMode = value['sensorMode'] || 'a'
                this.setStoreValue('sensor_mode', sensorMode)
                this.setSettings({sensor_mode: sensorMode})
                this._initUiModule();
            }

            if (value.hasOwnProperty('absMinHeatSetpointLimit')) {
                this.target_temp_setpoint_min = parseFloat((getInt16(value['absMinHeatSetpointLimit']) / 100).toFixed(1))
            }
            if (value.hasOwnProperty('absMaxHeatSetpointLimit')) {
                this.target_temp_setpoint_max = parseFloat((getInt16(value['absMaxHeatSetpointLimit']) / 100).toFixed(1))
            }

        }).catch(err => {
            let errMsg = "" + err
            if (errMsg === "Error: device_not_found" || errMsg === "reason: Error: device_not_found") {
                return
            }

            this.showMessage("" + err);
            this.setStoreValue('zb_first_init', true)

            this.homey.setTimeout(async () => {
                this._start()
            }, 5000)
        })

    }

    //init UI component module
    async _initUiModule() {

        if (this.getStoreValue('regulator_mode_changed') === true) {
            await this.showMessage(TIP_CHANGED)
        }

        try {
            let reg_mode = this.getStoreValue('sensor_mode') || 'a';
            ////this.log('restartApp->w:', reg_mode);

            if (!this.hasCapability('onoff')) {
                await this.addCapability("onoff");
            }
            if (!this.hasCapability('measure_power')) {
                await this.addCapability("measure_power");
            }
            if (!this.hasCapability('meter_power')) {
                await this.addCapability("meter_power");
            }
            if (!this.hasCapability('t7e_zg_window_state')) {
                await this.addCapability('t7e_zg_window_state');
            }
            if (this.hasCapability('t7e_zg_datetime')) {
                await this.removeCapability('t7e_zg_datetime')
            }

            if (!this.hasCapability('child_lock')) {
                await this.addCapability("child_lock");
            }

            //regulator heat mode
            if (reg_mode === 'p' || reg_mode === 'fp') {

                //remove
                if (this.hasCapability('target_temperature')) {
                    await this.removeCapability('target_temperature').catch(this.error)
                }
                if (this.hasCapability('measure_temperature')) {
                    await this.removeCapability('measure_temperature').catch(this.error)
                }
                if (this.hasCapability('eco_mode')) {
                    await this.removeCapability('eco_mode').catch(this.error)
                }
                if (this.hasCapability('frost')) {
                    await this.removeCapability('frost').catch(this.error)
                }

                //add
                if (!this.hasCapability('t7e_zg_regulator_percentage')) {
                    this.addCapability('t7e_zg_regulator_percentage').catch(this.error);
                }

                this.setSettings({
                    sensor_mode: 'p',
                    thermostat_regulator_mode: '1',
                }).catch(this.error);

                let rp = this.getStoreValue('t7e_zg_regulator_percentage') || 0.2;
                this.setCapabilityValue('t7e_zg_regulator_percentage', rp).catch(this.error);

                if (this.isFirstInit()) {
                    this.driver.triggerRegulator(this)
                }

            }

            //thermostat SE mode
            else {

                //remove
                if (this.hasCapability('t7e_zg_regulator_percentage')) {
                    await this.removeCapability('t7e_zg_regulator_percentage').catch(this.error)
                }

                //add
                if (!this.hasCapability('target_temperature')) {
                    await this.addCapability("target_temperature").catch(this.error);
                }
                if (!this.hasCapability('measure_temperature')) {
                    await this.addCapability("measure_temperature").catch(this.error);
                }
                if (!this.hasCapability('eco_mode')) {
                    await this.addCapability("eco_mode").catch(this.error);
                }
                if (!this.hasCapability('frost')) {
                    await this.addCapability("frost").catch(this.error);
                }

                let settings = this.getSettings();
                let mode1 = settings.sensor_mode;
                if (mode1 === 'p') {
                    mode1 = 'a';
                    this.setSettings({
                        sensor_mode: mode1,
                    }).catch(this.error);
                }
                this.setSettings({
                    thermostat_regulator_mode: '0',
                }).catch(this.error);

            }

        } catch (err) {
        }

        await this._initCapabilityAndListener();

        this.setStoreValue('app_initing', false).catch(this.error)
    }

    async _initCapabilityAndListener() {
        await this._setUpSystemCapabilities()
        this._setUpMeasureTemperatureCapability()
        this._setUpTargetTemperatureCapability()

        appkit.regulator_percentage.init(this)
        appkit.window_status.init(this)
        appkit.eco_mode.init(this)
        appkit.child_lock.init(this)
        appkit.frost.init(this)
        appkit.sensor_mode.init(this)
        appkit.fault.init(this)

        this.setStoreValue('regulator_mode_changed', false).catch(this.error);

        await this.setAvailable()
        await this.unsetWarning()
        await this._getAttributes()
        this.setDatetime()
    }


    async showMessage(msg) {
        await this.unsetWarning();
        await this.setWarning(msg).catch(this.error);
    }

    //==========================================================================================
    //        Report handler
    async _onHandlerReport() {

        this.onoffCluster().on('attr.onOff', async value => {
            //this.log(' ############# report onoff: ', value)
            this.setCapabilityValue('onoff', value).catch(this.error)
        })

        this.thermostatCluster().on('attr.frost', async value => {
            this.log(`-- rev frost 1 onoff = `, value)
            this.driver.triggerMyFlow(this, value || false);
        })

        this.thermostatCluster().on('attr.occupiedHeatingSetpoint', async value => {
            //this.log(`-----------event: occupiedHeatingSetpoint report `, value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            if (this.hasCapability('target_temperature')) {
                if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                    // add 0.001 to force update ui
                    this.setCapabilityValue('target_temperature',  + 0.001).catch(this.error)
                    this.setCapabilityValue('target_temperature', temp).catch(this.error)
                }
            }
        })
        this.thermostatCluster().on('attr.occupiedCoolingSetpoint', async value => {
            //this.log(`-----------event: occupiedCoolingSetpoint report `, value)
            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            if (this.hasCapability('target_temperature')) {
                if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                    this.setCapabilityValue('target_temperature',  + 0.001).catch(this.error)
                    this.setCapabilityValue('target_temperature', temp).catch(this.error)
                }
            }
        })

        //target temp limit report
        this.thermostatCluster().on('attr.absMinHeatSetpointLimit', async value => {
            this.log('--report min setpoint temp: ', value)
            this.target_temp_setpoint_min = parseFloat((getInt16(value) / 100).toFixed(1))
            await this.updateSetpointTempLimit()
        })
        this.thermostatCluster().on('attr.absMaxHeatSetpointLimit', async value => {
            this.log('--report max setpoint temp: ', value)
            this.target_temp_setpoint_max = parseFloat((getInt16(value) / 100).toFixed(1))
            await this.updateSetpointTempLimit()
        })

        this.thermostatCluster().on('attr.systemMode', async value => {
            this._setModeUI(value)
        })

        this.thermostatCluster().on('attr.syncTimeReq', async value => {
            if (value === true || value === 1) {
                this.setDatetime()
            }
        })

        this.thermostatCluster().on('attr.regulator', async value => {
            ////this.log('==========report regulator: ', value)
            this.setSettings({regulator: '' + value}).catch(this.error)
        })

        this.thermostatCluster().on('attr.windowCheck', async value => {
            ////this.log('===========report windowCheck: ', value)
            this.setSettings({window_check: value}).catch(this.error)
        })

        this.thermostatCluster().on('attr.sensorMode', async value => {
            this.setSettings({sensor_mode: value}).catch(this.error)
            this.setAvailable().catch(this.error)
            await this._checkModeStatus(value)
        })

        this.thermostatCluster().on('attr.backlight', async value => {
            if (value) {
                this.setSettings({lcd_backlight_wait: '' + value}).catch(this.error)
            }
        })
    }

    setDatetime() {
        let st = parseInt(Date.now() / 1000)
        this.thermostatCluster().writeAttributes({
            syncTime: st,
        }).then(() => {
        }).catch(err => {
            this.showMessage("" + err).catch(this.error)
        })
    }

    thermostatCluster() {
        return this.zclNode.endpoints[1].clusters.thermostat
    }

    onoffCluster() {
        return this.zclNode.endpoints[1].clusters.onOff
    }

    thermostatUserInterfaceConfiguration() {
        return this.zclNode.endpoints[1].clusters.thermostatUserInterfaceConfiguration
    }

    //set onoff, power, kwh
    async _setUpSystemCapabilities() {
        this.registerCapability('onoff', CLUSTER.ON_OFF)
        this.registerCapabilityListener('onoff', async isOn => {
            //init
            let initing = this.getStoreValue('app_initing') || false

            let modeChanged = this.getStoreValue('regulator_mode_changed')
            if (modeChanged === true) {
                if (initing === false) {
                    this.setStoreValue('app_initing', true).catch(this.error)
                    await this._start()
                }
                return;
            }

            //send command
            if (isOn) {
                await this.onoffCluster().setOn().catch((err) => {
                    this.setCapabilityValue('onoff', !isOn).catch(this.error)
                })
            } else {
                await this.onoffCluster().setOff().catch((err) => {
                    this.setCapabilityValue('onoff', !isOn).catch(this.error)
                })
            }

            //Power off, then set measure_power to 0
            if (isOn === false) {
                if (this.hasCapability('measure_power')) {
                    this.setCapabilityValue('measure_power', 0.0).catch(this.error)
                }
                if (this.hasCapability('meter_power')) {
                    this.setCapabilityValue('meter_power', 0.0).catch(this.error)
                }
            }
        })

        // meter_power
        if (this.hasCapability('meter_power')) {

            try {
                const {
                    multiplier, divisor
                } = await this.zclNode.endpoints[this.getClusterEndpoint(
                    CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
                    ['multiplier', 'divisor']).catch(this.error)

                //this.log('multiplier-divisor ', multiplier, divisor)


                if (multiplier && divisor) {
                    this.meter_multiplier = multiplier / divisor;
                }
            } catch (error) {
                //this.log('-------error: ', error)
            }

            this.registerCapability('meter_power', CLUSTER.METERING, {
                get: 'currentSummationDelivered',
                report: 'currentSummationDelivered',
                reportParser: value => {

                    //this.log(`+++++++++++ currentSummationDelivered report: `, value)
                    return value * this.meter_multiplier
                },
                getOpts: {
                    getOnStart: true, pollInterval: getOptBaseTime,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.001,
                    },
                },
            })
        }

        // measure_power
        if (this.hasCapability('measure_power')) {

            this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'activePower', report: 'activePower', reportParser: value => {
                    //this.log('+++++++++++ activePower report: ', value)
                    return value * this.power_multiplier
                }, getOpts: {
                    getOnStart: true, pollInterval: getOptBaseTime,
                }, reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.1,
                    },
                },
            })
        }

    }

    //Current temp
    _setUpMeasureTemperatureCapability() {

        if (!this.hasCapability('measure_temperature')) return

        this.thermostatCluster().on('attr.localTemperature', async value => {
            //this.log('==========report localTemperature: ', value)

            let temp = parseFloat((getInt16(value) / 100).toFixed(1))
            ////this.log(`localTemperature report `, value, temp)
            if (temp < -10) temp = -10
            if (temp > 60) temp = 60

            if (this.hasCapability('measure_temperature')) {
                this.setCapabilityValue('measure_temperature', temp).catch(this.error)
            }
        })
    }

    _setUpTargetTemperatureCapability() {

        if (!this.hasCapability('target_temperature')) return


        this.registerCapabilityListener('target_temperature', async value => {
            this.setting = true
            this.log(`---------- occupiedHeatingSetpoint setParser `, value)
            let payload = {}

            let curMode = this.getStoreValue('last_system_mode') || 'heat'
            if (curMode === 'heat') {
                payload['occupiedHeatingSetpoint'] = value * 100
            } else if (curMode === 'cool') {
                payload['occupiedCoolingSetpoint'] = value * 100
            }

            this.thermostatCluster().writeAttributes(payload)
                .then(() => {
                    this.homey.setTimeout(() => {
                        this.setting = false
                    }, 1000)
                })
                .catch((err) => {
                    this.setting = false
                    this.error(err)
                })
        })
        this.updateSetpointTempLimit().catch(this.error)
    }

    //  others

    async onSettings({oldSettings, newSettings, changedKeys}) {
        await this._setDeviceSettings(newSettings, changedKeys);
    }

    async _setDeviceSettings(newSettings, changedKeys) {
        changedKeys.forEach(element => {
            let o = appkit[element];
            if (o !== undefined) {
                if (o['setConfig']) {
                    o.setConfig(this, newSettings[element]);
                }
            }
        })
    }

    //init get device attributes.
    async _getAttributes() {
        if (this.thermostatUserInterfaceConfiguration() === null || this.thermostatUserInterfaceConfiguration() === undefined) {
            return
        }
        //child lock
        await this.thermostatUserInterfaceConfiguration().readAttributes(['keypadLockout']).then(value => {
            //this.log(`+++++++ child lock = `, value)
            if (value.hasOwnProperty('keypadLockout')) {
                let isOpen = value['keypadLockout'] === 'level1Lockout'
                this.setCapabilityValue('child_lock', isOpen).catch(this.error)
            }
        }).catch(this.error)

        // target_temperature
        if (this.hasCapability('target_temperature')) {
            await this.thermostatCluster().readAttributes(['occupiedHeatingSetpoint', 'occupiedCoolingSetpoint']).then(value => {

                let curMode = this.getStoreValue('last_system_mode') || 'heat'
                if (curMode === 'heat') {
                    const temp = parseFloat(
                        (value['occupiedHeatingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp).catch(this.error)
                        }
                    }

                } else if (curMode === 'cool') {
                    const temp = parseFloat(
                        (value['occupiedCoolingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp).catch(this.error)
                        }
                    }
                }

            }).catch(this.error)

            this.initTargetTempTimer()

        }

        //measure_temperature
        if (this.hasCapability('measure_temperature')) {
            try {
                await this.thermostatCluster().readAttributes(['localTemperature']).then(value => {
                    const temp = parseFloat(
                        (value['localTemperature'] / 100).toFixed(1))

                    if (temp > -20) {
                        if (this.hasCapability('measure_temperature')) {
                            this.setCapabilityValue('measure_temperature', temp).catch(this.error)
                        }
                    }

                }).catch(this.error)
            } catch (error) {
            }

        }

        //frost flag
        if (this.hasCapability('frost')) {
            await this.thermostatCluster().readAttributes(['frost']).then(value => {
                //this.log(`++++++ thermostat frost = `, value)

                if (value.hasOwnProperty('frost')) {
                    this.setCapabilityValue('frost', value['frost']).catch(this.error)
                }

            }).catch(this.error)
        }

        //t7e_zg_regulator_percentage
        if (this.hasCapability('t7e_zg_regulator_percentage')) {
            await this.thermostatCluster().readAttributes(['pIHeatingDemand']).then(value => {
                if (value.hasOwnProperty('pIHeatingDemand')) {
                    this.setCapabilityValue('t7e_zg_regulator_percentage', value['pIHeatingDemand'] / 100).catch(this.error)
                }

            }).catch(this.error)
        }

        //fault
        if (this.hasCapability('t7e_zg_fault')) {
            await this.thermostatCluster().readAttributes(["fault"]).then(value => {
                //this.log('++++++++++ fault report ', value)
                if (value.hasOwnProperty('fault')) {
                    let thefault = '0'
                    const faultValue = value['fault']
                    if (faultValue.length > 0) {
                        const res = faultValue.getBits();
                        thefault = res[res.length - 1];
                        ////this.log('@@@@ falut = ', res, thefault, res.length)
                        if (thefault === undefined) {
                            thefault = '0'
                        }
                    }
                    this.setCapabilityValue('t7e_zg_fault', thefault).catch(this.error)
                }
            }).catch(this.error)
        }

        //others
        await this.thermostatCluster().readAttributes(['windowState', 'backlight', 'thermostatProgramOperModel', 'regulator', 'backlightSwitch', 'sensorMode']).then(value => {

            if (value.hasOwnProperty('windowState')) {
                this.setCapabilityValue('t7e_zg_window_state', value['windowState'] ? "opened" : "closed").catch(this.error)
            }

            if (value.hasOwnProperty('backlight')) {
                this.setSettings({backlight: value['backlight'].toString()})
            }


            if (value.hasOwnProperty('thermostatProgramOperModel')) {
                try {
                    const res = value['thermostatProgramOperModel'].getBits();
                    this.log('--- App read attr: ', new Date(), res)
                    if (this.hasCapability('eco_mode')) {
                        this.setCapabilityValue('eco_mode', !!res.includes('eco')).catch(this.error).catch(this.error)
                    }
                } catch (ex) {
                }
            }

            if (value.hasOwnProperty('regulator')) {
                const regValue = value['regulator'].toString()
                this.setSettings({regulator: regValue})
            }

            if (value.hasOwnProperty('backlightSwitch')) {
                this.setSettings({window_check: value['backlightSwitch'] === true})
            }

            if (value.hasOwnProperty('sensorMode')) {
                this.setSettings({sensor_mode: value['sensorMode']})
                this._checkModeStatus(value['sensorMode'])
            }

        }).catch(this.error)


        await this.onoffCluster().readAttributes(['onOff']).then(async value => {
            ////this.log('$$$$$$$$$ onoff read: ', value)
            if (value.hasOwnProperty('onOff')) {
                this.setCapabilityValue('onoff', value.onOff).catch(this.error)
            }
        }).catch(this.error)


        //kwh
        try {
            const {
                multiplier, divisor, currentSummationDelivered
            } = await this.zclNode.endpoints[this.getClusterEndpoint(
                CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
                ['multiplier', 'divisor', 'currentSummationDelivered']).catch(this.error)

            if (multiplier && divisor) {
                this.meter_multiplier = multiplier / divisor;
            }

            this.setCapabilityValue('meter_power', this.meter_multiplier * currentSummationDelivered).catch(this.error)

        } catch (error) {
        }

        //power
        try {
            const {
                acPowerMultiplier, acPowerDivisor, activePower
            } = await this.zclNode.endpoints[this.getClusterEndpoint(
                CLUSTER.ELECTRICAL_MEASUREMENT)].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                ['acPowerMultiplier', 'acPowerDivisor', 'activePower']).catch(this.error)

            if (acPowerMultiplier && acPowerDivisor) {
                this.power_multiplier = acPowerMultiplier / acPowerDivisor;
            }

            this.setCapabilityValue('measure_power', this.power_multiplier * activePower).catch(this.error)

        } catch (error) {
        }
    }

    initTargetTempTimer() {
        this.log('++++++++++ initTargetTempTimer', this.target_temp_timer)
        this.homey.clearInterval(this.target_temp_timer)
        this.setStoreValue('reading', false)
        this.target_temp_timer = this.homey.setInterval( async() => {
            if (!this.hasCapability('target_temperature')) {
                this.homey.clearInterval(this.target_temp_timer)
                return;
            }
            const setting = this.setting
            if (setting) return;
            if (this.getStoreValue('reading')) return;
            this.setStoreValue('reading', true).catch(this.error)
            await this.thermostatCluster().readAttributes(['occupiedHeatingSetpoint', 'occupiedCoolingSetpoint']).then(async (value) => {
                this.setStoreValue('reading', false)
                const setting = this.setting
                if (setting) return;
                let curMode = this.getStoreValue('last_system_mode') || 'heat'
                if (curMode === 'heat') {
                    const temp = parseFloat(
                        (value['occupiedHeatingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp + 0.001)
                            this.setCapabilityValue('target_temperature', temp).catch(this.error)
                        }
                    }

                } else if (curMode === 'cool') {
                    const temp = parseFloat(
                        (value['occupiedCoolingSetpoint'] / 100).toFixed(1))
                    if (this.hasCapability('target_temperature')) {
                        if (temp >= this.target_temp_setpoint_min && temp <= this.target_temp_setpoint_max) {
                            this.setCapabilityValue('target_temperature', temp + 0.001)
                            this.setCapabilityValue('target_temperature', temp).catch(this.error)
                        }
                    }
                }

            }).catch((err) => {
                this.setStoreValue('reading', false)
                this.error(err)
            })
        }, 1000 * 10)
    }


    _setModeUI(mode) {
        if (mode === 'heat' || mode === 'cool') {
            this.setSettings({systemMode: mode}).catch(this.error)
            this.setStoreValue('last_system_mode', mode).catch(this.error);
        }
    }

    async _checkModeStatus(value) {
        //模式改变(A,F.... <-> P)
        //this.log('********* device cur mode: ', value)
        let changed = false
        let m = this.getStoreValue('sensor_mode') || 'a'
        this.log('_checkModeStatus+++++++++++++++++++++++++++++++', m, value)
        if ((m === 'p' || m === 'fp') && value !== 'p' && value !== 'fp') {
            changed = true
            this.setSettings({
                thermostat_regulator_mode: '0',
            }).catch(this.error);
        } else if ((m !== 'p' && m !== 'fp') && (value === 'p' || value === 'fp')) {
            changed = true
            this.setSettings({
                thermostat_regulator_mode: '1',
            }).catch(this.error);
        }

        if (changed) {
            this.setStoreValue('regulator_mode_changed', true).catch(this.error)
        }
    }

    async updateSetpointTempLimit() {
        if (!this.hasCapability('target_temperature')) return
        let target_temp = this.getCapabilityValue('target_temperature')
        let min = this.target_temp_setpoint_min
        let max = this.target_temp_setpoint_max
        let step = 0.5
        let capOptions = {};
        this.log('--温度选项: old: ', capOptions);
        if ((min !== undefined ? min : capOptions.min) >= (max !== undefined ? max : capOptions.max)) {
            return
        }
        try {
            if (min || max || step) {
                capOptions.min = min
                capOptions.max = max
                capOptions.step = step
                capOptions.decimals = step >= 0.5 ? 1 : 2
                await this.setCapabilityOptions('target_temperature', capOptions).then(result => {
                    this.log('---set target_temperature min-max: OK ', capOptions)
                    //温度范围内控制更新
                    if (target_temp > max) {
                        this.setCapabilityValue('target_temperature', max).catch(this.error)
                    }
                }).catch(error => {
                    this.log('---set target_temperature min-max: ', error)
                })
            }
        } catch (err) {
        }
    }

    async turnFrostRunListener(args, state) {
        await this.thermostatCluster()
        .writeAttributes({frost: args.frost})
        .then(() => {
            this.setCapabilityValue('frost', args.frost).catch(this.error);
        })
    }

    onDeleted() {
        this.homey.clearInterval(this.target_temp_timer)
    }

    onUninit() {
        this.homey.clearInterval(this.target_temp_timer)
    }

}


module.exports = t7e_zg_thermostat;
