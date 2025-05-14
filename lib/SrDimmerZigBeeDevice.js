'use strict'

const {ZigBeeDevice} = require("homey-zigbeedriver");
const {CLUSTER, TimeCluster} = require("zigbee-clusters");
const MAX_DIM = 254;

class HzcDimmerZigBeeDevice extends ZigBeeDevice {

    onNodeInit({zclNode}) {
        this.log('------HzcDimmerZigBeeDevice.onNodeInit ')
    }

    onDeleted() {
        super.onDeleted()
        this.log('------HzcDimmerZigBeeDevice.onDeleted ')
    }

    levelControlCluster() {
        const levelControlClusterEndpoint = this.getClusterEndpoint(CLUSTER.LEVEL_CONTROL) || 1;
        if (levelControlClusterEndpoint === null) throw new Error('missing_level_control_cluster');
        return this.zclNode.endpoints[levelControlClusterEndpoint].clusters.levelControl;
    }

    onOffCluster() {
        const onOffClusterEndpoint = this.getClusterEndpoint(CLUSTER.ON_OFF) || 1;
        if (onOffClusterEndpoint === null) throw new Error('missing_on_off_cluster');
        return this.zclNode.endpoints[onOffClusterEndpoint].clusters.onOff;
    }

    async registerSwitchOnoff() {

        if (this.hasCapability('onoff')) {

            this.registerCapabilityListener("onoff", async isOn => {
                this.log('------------onoff-ui-send: ', isOn)

                let onoffCluster = this.onOffCluster()

                if (isOn) {
                    if (onoffCluster) {
                        try {
                            return await onoffCluster.setOn().catch(this.error)
                        } catch (error) {
                            await this.setCapabilityValue("onoff", !isOn).catch(this.error)
                            this.log('error: ', error)
                            await this.setWarning("" + error).catch(this.error);
                        }
                    }
                } else {
                    if (onoffCluster) {
                        try {
                            return await onoffCluster.setOff().catch(this.error)
                        } catch (error) {
                            this.log('error: ', error)
                            await this.setCapabilityValue("onoff", !isOn).catch(this.error)
                            await this.setWarning("" + error).catch(this.error);
                        }
                    }
                }
            })


            this.onOffCluster().on('attr.onOff', async value => {
                this.log(' ############# report onoff: ', value)

                await this.setCapabilityValue('onoff', value).catch(this.error)

                if (value === false) {
                    await this.setCapabilityValue('dim', 0).catch(this.error)
                } else {
                    await this._init_app()
                }
            })
        }
    }

    async registerDim() {
        if (this.hasCapability('dim')) {

            this.registerCapabilityListener("dim", async dimValue => {
                this.log('------------dim-ui-send: ', dimValue)

                let value = dimValue
                // if (dimValue === 0) {
                //     value = 0.01
                // }

                if (value === 0) {
                    try {
                        return await this.levelControlCluster().moveToLevelWithOnOff({level: value * MAX_DIM}).then(async () => {
                            this.log('+moveToLevelWithOnOff: ')
                            return await this.setCapabilityValue('onoff', false).catch(this.error)

                        }).catch(this.error)
                    } catch (error) {
                        this.log('++moveToLevelWithOnOff : ', error)
                        await this.levelControlCluster().stop().catch(this.error)
                        await this.setWarning("" + error).catch(this.error);
                    }
                } else if (value > 0) {
                    try {
                        this.log('++move to : ', value)
                        return await this.levelControlCluster().moveToLevel({level: value * MAX_DIM}).then(async result => {
                            return await this.setCapabilityValue('onoff', true).catch(this.error)
                        }).catch(this.error)
                    } catch (error) {
                        this.log('++move to: ', error)
                        await this.levelControlCluster().stop().catch(this.error)
                        await this.setWarning("" + error).catch(this.error);
                    }
                }
            })

            this.log('############# report level123: ')
            this.levelControlCluster().on('attr.currentLevel', async value => {
                this.log('############# report level: ', value, value / MAX_DIM)
                await this.setCapabilityValue('dim', value / MAX_DIM).catch(this.error)
            })
        }
    }


    async registerMeterPowerMeasurePower(endpoint) {

        //=========================================================================
        //=========================================================================
        //  meter_power

        if (this.app_inited === undefined) {
            this.app_inited = false
        }

        if (this.hasCapability('meter_power_' + endpoint)) {
            this.registerCapability('meter_power_' + endpoint, CLUSTER.METERING, {
                getParser: function (value) {
                    if (!this.app_inited) return 0
                    return value * this.params.meter_power.multiplier
                },
                get: 'currentSummationDelivered',
                report: 'currentSummationDelivered',
                reportParser: function (value) {
                    if (!this.app_inited) return 0
                    this.log('++report: meter_power_' + endpoint, value, this.params.meter_power.multiplier)
                    return value * this.params.meter_power.multiplier;
                },
                endpoint: endpoint,
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
            })
        }
        if (this.hasCapability('meter_power') && endpoint === 1) {

            this.registerCapability('meter_power', CLUSTER.METERING, {
                get: 'currentSummationDelivered',
                report: 'currentSummationDelivered',
                reportParser: function (value) {
                    if (!this.app_inited) return 0
                    this.log('++report: meter_power', value, this.params.meter_power.multiplier)
                    return value * this.params.meter_power.multiplier;
                },
                getParser: function (value) {
                    if (!this.app_inited) return 0
                    return value * this.params.meter_power.multiplier
                },
                endpoint: endpoint,
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
            })
        }


        //=========================================================================
        //=========================================================================
        // measure_power

        if (this.hasCapability('measure_power_' + endpoint)) {

            this.registerCapability('measure_power_' + endpoint, CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'activePower',
                report: 'activePower',
                reportParser: value => {
                    if (!this.app_inited) return 0
                    this.log('========report: measure_power_' + endpoint, value, this.params.measure_power.multiplier)
                    return value * this.params.measure_power.multiplier
                },
                getParser: function (value) {
                    if (!this.app_inited) return 0
                    return value * this.params.measure_power.multiplier
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
                endpoint: endpoint
            })
        }

        if (this.hasCapability('measure_power') && endpoint === 1) {

            this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'activePower',
                report: 'activePower',
                reportParser: value => {
                    if (!this.app_inited) return 0
                    this.log('========report: measure_power_' + endpoint, value, this.params.measure_power.multiplier)
                    return value * this.params.measure_power.multiplier
                },
                getParser: function (value) {
                    if (!this.app_inited) return 0
                    return value * this.params.measure_power.multiplier
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
                endpoint: endpoint
            })

        }

        // rms_current

        if (this.hasCapability('rms_current') && endpoint === 1) {

            this.registerCapability('rms_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'rmsCurrent',
                report: 'rmsCurrent',
                reportParser: value => {
                    if (!this.app_inited) return '0'
                    this.log('========report: rms_current-' + endpoint, value, this.params.rms_current.multiplier)
                    return (value * this.params.rms_current.multiplier).toFixed(2)
                },
                getParser: function (value) {
                    if (!this.app_inited) return '0'
                    return (value * this.params.rms_current.multiplier).toFixed(2)
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
                endpoint: endpoint
            })
        }

        if (this.hasCapability('rms_current_' + endpoint)) {

            this.registerCapability('rms_current_' + endpoint, CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'rmsCurrent',
                report: 'rmsCurrent',
                reportParser: value => {

                    if (!this.app_inited) return '0'
                    this.log('========report: rms_current-' + endpoint, value, this.params.rms_current.multiplier)
                    return (value * this.params.rms_current.multiplier).toFixed(2)
                },
                getParser: function (value) {
                    if (!this.app_inited) return '0'
                    return (value * this.params.rms_current.multiplier).toFixed(2)
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
                endpoint: endpoint
            })
        }

        // rms_voltage

        if (this.hasCapability('rms_voltage') && endpoint === 1) {

            this.registerCapability('rms_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'rmsVoltage',
                report: 'rmsVoltage',
                reportParser: value => {
                    if (!this.app_inited) return '0'
                    this.log('========report: rmsVoltage-' + endpoint, value, this.params.rms_voltage.multiplier)
                    return (value * this.params.rms_voltage.multiplier).toFixed(1)
                },
                getParser: function (value) {
                    if (!this.app_inited) return '0'
                    return (value * this.params.rms_voltage.multiplier).toFixed(1)
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 15,
                    },
                },
                endpoint: endpoint
            })
        }

        if (this.hasCapability('rms_voltage_' + endpoint)) {

            this.registerCapability('rms_voltage_' + endpoint, CLUSTER.ELECTRICAL_MEASUREMENT, {
                get: 'rmsVoltage',
                report: 'rmsVoltage',
                reportParser: value => {
                    if (!this.app_inited) return '0'
                    this.log('========report: rmsVoltage-' + endpoint, value, this.params.rms_voltage.multiplier)
                    return (value * this.params.rms_voltage.multiplier).toFixed(1)
                },
                getParser: function (value) {
                    if (!this.app_inited) return '0'
                    return (value * this.params.rms_voltage.multiplier).toFixed(1)
                },
                getOpts: {
                    getOnStart: true,
                    getOnOnline: true,
                    pollInterval: 60 * 60 * 1000,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 1,
                        maxInterval: 300,
                        minChange: 15,
                    },
                },
                endpoint: endpoint
            })
        }


    }


    /**
     * 系统启动，初始化参数
     */
    async _init_app() {
        this.setAvailable().catch(this.error)

        if (this.params === undefined) {
            this.params = {}
        }
        if (this.app_inited === undefined) {
            this.app_inited = false
        }

        this.log('-------app inited start: ', this.params)
        let inited = true

        await this.unsetWarning().catch(this.error)

        if (this.hasCapability('meter_power') || this.hasCapability('meter_power_1')) {
            let meterFactory = 1.0 / 3600000
            try {
                const {
                    multiplier,
                    divisor,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.METERING.NAME].readAttributes(
                    ['multiplier', 'divisor']).catch(this.error)

                if (multiplier != undefined && divisor != undefined &&
                    multiplier > 0 && divisor > 0) {
                    meterFactory = multiplier / divisor
                    this.params.meter_power = {multiplier: meterFactory, updated: true}
                }
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
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                    ['acPowerMultiplier', 'acPowerDivisor']).catch(this.error)
                this.log('---------read measure_power: ', acPowerMultiplier, acPowerDivisor)
                if (acPowerMultiplier != undefined && acPowerDivisor != undefined &&
                    acPowerMultiplier > 0 && acPowerDivisor > 0) {
                    measureFactory = acPowerMultiplier / acPowerDivisor
                    this.params.measure_power = {multiplier: measureFactory, updated: true}
                }
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
                    rmsVoltage,
                    acVoltageMultiplier,
                    acVoltageDivisor,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                    ['rmsVoltage', 'acVoltageMultiplier', 'acVoltageDivisor']).catch(this.error)
                this.log('---------read voltage: ', rmsVoltage, acVoltageMultiplier, acVoltageDivisor)

                if (acVoltageMultiplier > 0 && acVoltageDivisor > 0) {
                    measureFactory = acVoltageMultiplier / acVoltageDivisor
                    this.params.rms_voltage = {multiplier: measureFactory, updated: true}
                }

                if (rmsVoltage != undefined) {

                    if (this.hasCapability('rms_voltage')) {
                        this.setCapabilityValue('rms_voltage', "" + (rmsVoltage * this.params.rms_voltage.multiplier).toFixed(1)).catch(this.error)
                    }
                    if (this.hasCapability('rms_voltage_1')) {
                        this.setCapabilityValue('rms_voltage_1', "" + (rmsVoltage * this.params.rms_voltage.multiplier).toFixed(1)).catch(this.error)
                    }
                    if (this.hasCapability('rms_voltage_2')) {
                        this.setCapabilityValue('rms_voltage_2', "" + (rmsVoltage * this.params.rms_voltage.multiplier).toFixed(1)).catch(this.error)
                    }

                }

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
                    rmsCurrent,
                    acCurrentMultiplier,
                    acCurrentDivisor,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
                    ['rmsCurrent', 'acCurrentMultiplier', 'acCurrentDivisor']).catch(this.error)
                this.log('---------read current: ', rmsCurrent, acCurrentMultiplier, acCurrentDivisor)

                if (acCurrentMultiplier > 0 && acCurrentDivisor > 0) {
                    measureFactory = acCurrentMultiplier / acCurrentDivisor
                    this.params.rms_current = {multiplier: measureFactory, updated: true}
                }

                if (rmsCurrent != undefined) {
                    if (this.hasCapability('rms_current')) {
                        this.setCapabilityValue('rms_current', "" + (rmsCurrent * this.params.rms_current.multiplier).toFixed(2)).catch(this.error)
                    }
                    if (this.hasCapability('rms_current_1')) {
                        this.setCapabilityValue('rms_current_1', "" + (rmsCurrent * this.params.rms_current.multiplier).toFixed(2)).catch(this.error)
                    }
                    if (this.hasCapability('rms_current_2')) {
                        this.setCapabilityValue('rms_current_2', "" + (rmsCurrent * this.params.rms_current.multiplier).toFixed(2)).catch(this.error)
                    }
                }

            } catch (error) {
                this.log('xxxxxxx read rms current params: ', error)
                inited = false
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
            }

        }

        if (this.hasCapability('onoff')) {
            try {
                const {
                    onOff,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes(
                    ['onOff']).catch(this.error).catch(this.error)

                if (onOff != undefined) {
                    await this.setCapabilityValue('onoff', onOff).catch(this.error)
                }
            } catch (error) {
                this.log('xxxxxxx read rms current params: ', error)
                inited = false
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
            }
        }

        if (this.hasCapability('dim')) {
            try {
                const {
                    currentLevel,
                } = await this.zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].readAttributes(
                    ['currentLevel']).catch(this.error).catch(this.error)
                this.log('dim +++++++++++++++++++++', currentLevel)
                if (currentLevel != undefined) {
                    if (this.hasCapability('onoff')) {
                        if (this.getCapabilityValue('onoff') === true) {
                            await this.setCapabilityValue('dim', currentLevel / MAX_DIM).catch(this.error)
                        }
                    }
                }
            } catch (error) {
                this.log('xxxxxxx read rms current params: ', error)
                inited = false
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
            }
        }


        if (inited === false) {

            this.homey.setTimeout(() => {
                this._init_app()
            }, 10000)

            this.log('xxxxxxxxxx init :', this.tipinfo)
            await this.setWarning("Error: Device is not responding, make sure the device has power.").catch(this.error)
            this.setUnavailable().catch(this.error)
            return
        }

        this.app_inited = true
        this.log('-------app inited : ', this.params)

    } //end of init app


}

module.exports = HzcDimmerZigBeeDevice;