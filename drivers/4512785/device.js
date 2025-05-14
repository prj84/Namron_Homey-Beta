'use strict'

const {CLUSTER, Cluster} = require('zigbee-clusters')
const destructConstProps = function ({ID, NAME, ATTRIBUTES, COMMANDS}) {
    return Object.freeze({
        ID,
        NAME,
        ATTRIBUTES,
        COMMANDS,
    });
}

const HzcSwitchUserInterfaceConfigurationCluster = require('../../lib/HzcSwitchUserInterfaceConfigurationCluster')
const HzcSwitch2GangZigBeeDevice = require('../../lib/HzcSwitch2GangZigBeeDevice')

Cluster.addCluster(HzcSwitchUserInterfaceConfigurationCluster)
CLUSTER['SWITCH_USER_INTERFACE_CONFIGURATION'] = destructConstProps(HzcSwitchUserInterfaceConfigurationCluster)


class s730_zg_Device extends HzcSwitch2GangZigBeeDevice {

    onEndDeviceAnnounce() {
    }


    async onNodeInit({zclNode, node}) {
        await super.onNodeInit({zclNode: zclNode, node: node})


        await this.addCapability('onoff');
        await this.addCapability('meter_power');
        await this.addCapability('measure_power');

        await this.addCapability('rms_voltage')
        await this.addCapability('rms_current')

        await this.addCapability('ac_alarm')
        await this.addCapability('device_temperature_alarm')

        //Temp measurement
        await this.addCapability('hzc_tm_measured_value_1')
        await this.addCapability('hzc_tm_measured_value_2')
        await this.addCapability('hzc_tm_water_sensor_alarm')

        await this.addCapability('alarm_water_condition')
        await this.addCapability('alarm_ntc_condition')


        //init settings
        try {
             this.addCapability('reset_condition_alarm');
            this.registerCapabilityListener('reset_condition_alarm', async () => {
                // Maintenance action button was pressed
                this.switchUserInterfaceConfiguration().setClear()
                    .then(() => {
                        this.setWarning("Clear Auto Trigger Flag Success");
                    })
                    .catch(this.error)
            });
        } catch (e) {
            this.error(e)
        }
        await this.switchUserInterfaceConfiguration().on('attr.resistanceValue1', async value => {
            this.log('==========report resistanceValue1: ', value)
            this.setSettings({resistance_value_1: '' + value}).catch(this.error)
        })

        await this.switchUserInterfaceConfiguration().on('attr.resistanceValue2', async value => {
            this.log('==========report resistanceValue2: ', value)
            this.setSettings({resistance_value_2: '' + value}).catch(this.error)
        })

        await this.switchUserInterfaceConfiguration().on('attr.waterConditionAlarm', async value => {
            this.log('==========report waterConditionAlarm: ', value)
            this.setCapabilityValue('alarm_water_condition', value).catch(this.error)
        })

        await this.switchUserInterfaceConfiguration().on('attr.ntcConditionAlarm', async value => {
            this.log('==========report ntcConditionAlarm: ', value)
            this.setCapabilityValue('alarm_ntc_condition', value).catch(this.error)
        })

        this.app_inited = false
        this.hzc_tm_measured_1_value = 0
        this.hzc_tm_measured_2_value = 0
        this.params = {}

        await this._app_register()

        //init app
        await this._init_app_2()
    }

    async _app_register() {

        //register
        await this.registerSwitchOnoff(1)
        await this.registerMeterPowerMeasurePower(1)

        await this.registerRmsVoltage(1)
        await this.registerRmsCurrent(1)

        //this.registerAlarm()
        this.registerAcAlarm1()
        this.registerDeviceTemperatureAlarm1()

        this._setupTemperatureMeasurement()
    }

    temperatureMeasurementCluster() {
        return this.zclNode.endpoints[1].clusters.temperatureMeasurement
    }

    switchUserInterfaceConfiguration() {
        return this.zclNode.endpoints[1].clusters.switchUserInterfaceConfiguration
    }

    _setupTemperatureMeasurement() {
        //Water alarm
        if (this.hasCapability('hzc_tm_water_sensor_alarm')) {
            this.registerCapability('hzc_tm_water_sensor_alarm', CLUSTER.SWITCH_USER_INTERFACE_CONFIGURATION, {
                get: 'waterSensorValue',
                report: 'waterSensorValue',
                reportParser: value => {
                    this.log(`****************************waterSensorValue`, value)
                    if (value) {
                        this.driver.triggers_flow_Water_Alarm(this)
                    } else {
                        this.driver.triggers_flow_No_Water_Alarm(this)
                    }
                    this.driver.triggers_flow_water_sensor(this)
                    return value
                },
                getOpts: {
                    getOnStart: true,
                    pollInterval: 60 * 60 * 1000,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.5,
                    },
                },
            })
        }

        if (this.hasCapability('hzc_tm_measured_value_1')) {

            this.registerCapability('hzc_tm_measured_value_1', CLUSTER.TEMPERATURE_MEASUREMENT, {
                get: 'measuredValue',
                report: 'measuredValue',
                reportParser: async value => {
                    this.log(`measuredValue 1 = `, value)
                    if (this.hzc_tm_measured_1_value !== value) {
                        this.hzc_tm_measured_1_value = value
                        this.driver.triggers_flow_NTC1_sensor_changed(this)
                    }
                    await this.driver.triggers_flow_Set_NTC1_Temperature(this)
                    return value / 100
                },
                getOpts: {
                    getOnStart: true,
                    pollInterval: 60 * 60 * 1000,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 10,
                    },
                },
            })
        }

        if (this.hasCapability('hzc_tm_measured_value_2')) {
            this.registerCapability('hzc_tm_measured_value_2', CLUSTER.SWITCH_USER_INTERFACE_CONFIGURATION, {
                get: 'measuredValue2',
                report: 'measuredValue2',
                reportParser: value => {
                    this.log(`measuredValue 2 = `, value, this.hzc_tm_measured_2_value)
                    if (value === 32768 || value === -32768) {
                        //return 0
                    }
                    if (this.hzc_tm_measured_2_value !== value) {
                        this.hzc_tm_measured_2_value = value
                        this.driver.triggers_flow_NTC2_sensor_changed(this)
                    }
                    this.driver.triggers_flow_Set_NTC2_Temperature(this)
                    return value / 100
                },
                getOpts: {
                    getOnStart: true,
                    pollInterval: 60 * 60 * 1000,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 10,
                    },
                },
            })
        }
    }

    registerDeviceTemperatureAlarm1() {
        if (this.hasCapability('device_temperature_alarm')) {

            this.registerCapability('device_temperature_alarm', CLUSTER.DEVICE_TEMPERATURE, {
                get: 'deviceTempAlarmMask',
                report: 'deviceTempAlarmMask',
                reportParser: value => {
                    this.log(`+++++++ deviceTempAlarmMask : `, value)
                    const res = value.getBits()
                    if (res.length > 0) {
                        if (res.includes('deviceTemperatureTooLow')) {
                            return 'Too Low'
                        }
                        if (res.includes('deviceTemperatureTooHigh')) {
                            return 'Too High'
                        }
                    }
                    return 'Normal Temp.'
                },
                getOpts: {
                    getOnStart: true,
                    pollInterval: 60 * 60 * 1000,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.5,
                    },
                },
            })
        }
    }

    registerAcAlarm1() {
        if (this.hasCapability('ac_alarm')) {

            this.registerCapability('ac_alarm', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'acAlarmsMask',
                report: 'acAlarmsMask',
                reportParser: value => {
                    this.log(`acAlarmsMask `, value)
                    const res = value.getBits()
                    if (res.length > 0) {
                        this.driver.triggers_flow_current_alarm(this)
                        return res[0]
                    }
                    return 'No'
                },
                getOpts: {
                    getOnStart: true,
                    pollInterval: 60 * 60 * 1000,
                    getOnOnline: true
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 10,
                        maxInterval: 60000,
                        minChange: 0.5,
                    },
                },
            })
        }
    }

    onDeleted() {
        super.onDeleted()
        this.log("s730_zg_Device, channel ", " removed")
    }

    async onSettings({oldSettings, newSettings, changedKeys}) {
        this._setDeviceSettings(newSettings, changedKeys);
    }

    async _setDeviceSettings(newSettings, changedKeys) {

        this.log('+++++ settings ： ', newSettings, changedKeys);

        changedKeys.forEach(element => {
            if (element === "condition_alarm_relay_action") {
                const onOff = newSettings[element] === "ConditionAlarmTurnOn";
                this.switchUserInterfaceConfiguration().writeAttributes({isExecuteCondition: onOff }).catch(this.error)
            }
            else if (element === 'resistance_value_1') {
                this.switchUserInterfaceConfiguration().writeAttributes({resistanceValue1: newSettings[element]}).catch(this.error)
            } else if (element === 'resistance_value_2') {
                this.switchUserInterfaceConfiguration().writeAttributes({resistanceValue2: newSettings[element]}).catch(this.error)
            } else if (element === 'water_alarm_relay_action') {
                this.switchUserInterfaceConfiguration().writeAttributes({waterAlarmRelayAction: newSettings[element]}).catch(this.error)
            } else if (element === 'ntc1OperationSelect') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc1OperationSelect: newSettings[element]}).catch(this.error)
            } else if (element === 'ntc2OperationSelect') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc2OperationSelect: newSettings[element]}).catch(this.error)
            } else if (element === 'ntc1RelayAutoTemp') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc1RelayAutoTemp: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'ntc2RelayAutoTemp') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc2RelayAutoTemp: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'NTCCalibration1') {
                this.switchUserInterfaceConfiguration().writeAttributes({NTCCalibration1: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'NTCCalibration2') {
                this.switchUserInterfaceConfiguration().writeAttributes({NTCCalibration2: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'OverrideOption') {
                this.switchUserInterfaceConfiguration().writeAttributes({overrideOption: newSettings[element]}).catch(this.error)
            } else if (element === 'ntc1TempHysterisis') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc1TempHysterisis: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'ntc2TempHysterisis') {
                this.switchUserInterfaceConfiguration().writeAttributes({ntc2TempHysterisis: 10 * newSettings[element]}).catch(this.error)
            } else if (element === 'ClearAutoTriggerFlag') {
                if (newSettings[element]) {
                    this.switchUserInterfaceConfiguration().setClear()
                }
            }
        })
    }

    ///====================================================================================================
    ///====================================================================================================
    ///====================================================================================================


    /**
     * 系统启动，初始化参数
     */
    async _init_app_2() {

        this.setAvailable().catch(this.error)

        if (this.params === undefined) {
            this.params = {}
        }

        if (this.app_inited === undefined) {
            this.app_inited = false
        }

        this.log('-------app inited start: ', this.params)
        let inited = true

        if (this.hasCapability('meter_power') || this.hasCapability('meter_power_1')) {
            let meterFactory = 1.0 / 3600000
            try {
                const {
                    multiplier,
                    divisor,
                    currentSummationDelivered
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.METERING.NAME].readAttributes(
                    ['multiplier', 'divisor', 'currentSummationDelivered']).catch(err => this.error(err))

                if (multiplier != undefined && divisor != undefined &&
                    multiplier > 0 && divisor > 0) {
                    meterFactory = multiplier / divisor
                    this.params.meter_power = {multiplier: meterFactory, updated: true}
                }

                await this.setCapabilityValue('meter_power', currentSummationDelivered * meterFactory).catch(this.error)

            } catch (error) {
                this.log('------------read meter power params: ', error)
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
                inited = false
            }
        }

        if (this.hasCapability('measure_power') || this.hasCapability('measure_power_1')) {
            let measureFactory = 0.1
            try {
                const {
                    acPowerMultiplier,
                    acPowerDivisor,
                    activePower
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                    ['acPowerMultiplier', 'acPowerDivisor', 'activePower']).catch(err => this.error(err))

                this.log('+++++++++++++++++++++++++ acPowerMultiplier, acPowerDivisor ', acPowerMultiplier, acPowerDivisor, activePower)

                if (acPowerMultiplier != undefined && acPowerDivisor != undefined &&
                    acPowerMultiplier > 0 && acPowerDivisor > 0) {
                    measureFactory = acPowerMultiplier / acPowerDivisor
                    this.params.measure_power = {multiplier: measureFactory, updated: true}
                }

                this.setCapabilityValue('measure_power', activePower * measureFactory).catch(this.error)

            } catch (error) {
                this.log('------------read measure_power params: ', error)
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
                inited = false
            }
        }

        if (this.hasCapability('rms_voltage') || this.hasCapability('rms_voltage_1')) {

            let measureFactory = 0.1
            try {
                const {
                    acVoltageMultiplier,
                    acVoltageDivisor,
                    rmsVoltage
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(['acVoltageMultiplier', 'acVoltageDivisor', 'rmsVoltage']).catch(err => this.error(err))

                this.log('+++++++++++++++++++++++++ acVoltageMultiplier, acVoltageDivisor ', acVoltageMultiplier, acVoltageDivisor, rmsVoltage)

                if (acVoltageMultiplier > 0 && acVoltageDivisor > 0) {
                    measureFactory = acVoltageMultiplier / acVoltageDivisor
                    this.params.rms_voltage = {multiplier: measureFactory, updated: true}
                }

                await this.setCapabilityValue('rms_voltage', (rmsVoltage * measureFactory).toFixed(1)).catch(this.error)

            } catch (error) {
                this.log('xxxxxx read rms_voltage params : ', error)
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
                inited = false
            }

        }

        if (this.hasCapability('rms_current') || this.hasCapability('rms_current_1')) {

            let measureFactory = 1 / 1000
            try {
                const {
                    acCurrentMultiplier,
                    acCurrentDivisor,
                    rmsCurrent,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                    ['acCurrentMultiplier', 'acCurrentDivisor', 'rmsCurrent']).catch(err => this.error(err))

                this.log('+++++++++++++++++++++++++ acCurrentMultiplier, acCurrentDivisor ', acCurrentMultiplier, acCurrentDivisor, rmsCurrent)


                if (acCurrentMultiplier > 0 && acCurrentDivisor > 0) {
                    measureFactory = acCurrentMultiplier / acCurrentDivisor
                    this.params.rms_current = {multiplier: measureFactory, updated: true}
                }

                await this.setCapabilityValue('rms_current', (rmsCurrent * measureFactory).toFixed(2)).catch(this.error)

            } catch (error) {
                this.log('xxxxxxx read rms current params: ', error)
                inited = false
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
            }

        }


        try {
            let resistanceValue0 = await this.temperatureMeasurementCluster().readAttributes(
                ["measuredValue"]).catch(err => this.error(err))

            let resistanceValue = await this.switchUserInterfaceConfiguration().readAttributes(
                [
                    "measuredValue2",
                    "resistanceValue1",
                    "resistanceValue2",
                    "waterAlarmRelayAction",
                    "overrideOption",
                    "NTCCalibration1",
                    "NTCCalibration2",
                    "ntc1OperationSelect",
                    "ntc2OperationSelect",
                    "ntc1RelayAutoTemp",
                    "ntc2RelayAutoTemp",
                    "ntc1TempHysterisis",
                    "ntc2TempHysterisis",
                    "isExecuteCondition"
                ]).catch(err => this.error(err))

            let resistanceValue2 = await this.switchUserInterfaceConfiguration().readAttributes(
                [
                    "waterConditionAlarm",
                    "ntcConditionAlarm",
                ]).catch(err => this.error(err))


            this.log('==========read  resistanceValue=', resistanceValue, resistanceValue0, resistanceValue2)

            if (resistanceValue0 != undefined && resistanceValue != undefined && resistanceValue2 != undefined) {


                if (resistanceValue.hasOwnProperty('isExecuteCondition')) {
                    const id = resistanceValue['isExecuteCondition'] ? "ConditionAlarmTurnOn" : "ConditionAlarmTurnOff";
                    await this.setSettings({condition_alarm_relay_action: id }).catch(this.error)
                }

                if (resistanceValue0.hasOwnProperty('measuredValue')) {
                    if (this.hasCapability("hzc_tm_measured_value_1")) {
                        let measuredValue = resistanceValue0['measuredValue'] / 100
                        await this.setCapabilityValue('hzc_tm_measured_value_1', measuredValue).catch(this.error)
                    }
                }

                if (resistanceValue.hasOwnProperty('measuredValue2')) {
                    if (this.hasCapability("hzc_tm_measured_value_2")) {
                        let measuredValue = resistanceValue['measuredValue2'] / 100
                        await this.setCapabilityValue('hzc_tm_measured_value_2', measuredValue).catch(this.error)
                    }
                }

                if (resistanceValue2.hasOwnProperty('waterConditionAlarm')) {
                    if (this.hasCapability("alarm_water_condition")) {
                        await this.setCapabilityValue('alarm_water_condition', resistanceValue2['waterConditionAlarm']).catch(this.error)
                    }
                }

                if (resistanceValue2.hasOwnProperty('ntcConditionAlarm')) {
                    if (this.hasCapability("alarm_ntc_condition")) {
                        await this.setCapabilityValue('alarm_ntc_condition', resistanceValue2['ntcConditionAlarm']).catch(this.error)
                    }
                }

                if (resistanceValue.hasOwnProperty('resistanceValue1')) {
                    await this.setSettings({resistance_value_1: '' + resistanceValue['resistanceValue1']}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty('resistanceValue2')) {
                    await this.setSettings({resistance_value_2: '' + resistanceValue['resistanceValue2']}).catch(this.error)
                }

                if (resistanceValue.hasOwnProperty('waterAlarmRelayAction')) {
                    await this.setSettings({water_alarm_relay_action: '' + resistanceValue['waterAlarmRelayAction']}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty('ntc1OperationSelect')) {
                    await this.setSettings({ntc1OperationSelect: '' + resistanceValue['ntc1OperationSelect']}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty('ntc2OperationSelect')) {
                    await this.setSettings({ntc2OperationSelect: '' + (resistanceValue['ntc2OperationSelect'] || 'unuse')}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty('ntc1RelayAutoTemp')) {
                    await this.setSettings({ntc1RelayAutoTemp: resistanceValue['ntc1RelayAutoTemp'] / 10}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty('ntc2RelayAutoTemp')) {
                    await this.setSettings({ntc2RelayAutoTemp: resistanceValue['ntc2RelayAutoTemp'] / 10}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty("NTCCalibration1")) {
                    await this.setSettings({NTCCalibration1: resistanceValue['NTCCalibration1'] / 10}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty("NTCCalibration2")) {
                    await this.setSettings({NTCCalibration2: resistanceValue['NTCCalibration2'] / 10}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty("overrideOption")) {
                    await this.setSettings({OverrideOption: resistanceValue['overrideOption']}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty("ntc1TempHysterisis")) {
                    await this.setSettings({ntc1TempHysterisis: resistanceValue['ntc1TempHysterisis'] / 10}).catch(this.error)
                }
                if (resistanceValue.hasOwnProperty("ntc2TempHysterisis")) {
                    await this.setSettings({ntc2TempHysterisis: resistanceValue['ntc2TempHysterisis'] / 10}).catch(this.error)
                }
            }

        } catch (error) {
            inited = false
            this.tipinfo = "Error: Device is not responding, make sure the device has power."
        }

        if (inited === false) {

            this.homey.setTimeout(() => {
                this._init_app_2()
            }, 10000)

            this.log('xxxxxxxxxx init :', this.tipinfo)
            await this.setWarning("Error: Device is not responding, make sure the device has power.");
            this.setUnavailable().catch(this.error)
            return
        } else {
            this.setAvailable().catch(this.error)
            this.unsetWarning().catch(this.error)
        }

        this.app_inited = true
        this.log('-------app inited : ', inited, this.params)

        await this._timer_loop()

    } //end of init app


    async _timer_loop() {
        if (!this.app_inited) return;

        try {
            let resistanceValue0 = await this.temperatureMeasurementCluster().readAttributes(
                ["measuredValue"]).catch(err => this.error(err))

            let resistanceValue = await this.switchUserInterfaceConfiguration().readAttributes(
                ["measuredValue2", "waterSensorValue"]).catch(err => this.error(err))

            this.log('==========read _timer_loop =', resistanceValue0, resistanceValue)

            if (resistanceValue0 != undefined && resistanceValue != undefined) {
                if (resistanceValue0.hasOwnProperty('measuredValue')) {
                    if (this.hasCapability("hzc_tm_measured_value_1")) {
                        let measuredValue = resistanceValue0['measuredValue'] / 100
                        this.setCapabilityValue('hzc_tm_measured_value_1', measuredValue).catch(this.error)
                    }
                }

                if (resistanceValue.hasOwnProperty('measuredValue2')) {
                    if (this.hasCapability("hzc_tm_measured_value_2")) {
                        let measuredValue = resistanceValue['measuredValue2'] / 100
                        this.setCapabilityValue('hzc_tm_measured_value_2', measuredValue).catch(this.error)
                    }
                }

                if (resistanceValue.hasOwnProperty('waterSensorValue')) {
                    if (this.hasCapability('hzc_tm_water_sensor_alarm')) {
                        this.setCapabilityValue('hzc_tm_water_sensor_alarm', resistanceValue['waterSensorValue']).catch(this.error)
                    }
                }
            }

        } catch (error) {

        }

        // this.homey.setTimeout(async () => {
        //     await this._timer_loop()
        // }, 5 * 60 * 1000)

    }

}

module.exports = s730_zg_Device;