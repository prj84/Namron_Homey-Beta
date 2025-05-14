'use strict'


const {CLUSTER, Cluster} = require('zigbee-clusters')
const SrBasicCluster = require('../../lib/SrBasicCluster')
Cluster.addCluster(SrBasicCluster)

const SrSwitch2GangZigBeeDevice = require('../../lib/SrSwitch2GangZigBeeDevice')


class S728zg_2gang_switch_Device extends SrSwitch2GangZigBeeDevice {

    async onNodeInit({zclNode}) {
        super.onNodeInit({zclNode})

        this.log('+Cluster: ', this.zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME])
        const SrBasicCluster = require('../../lib/SrBasicCluster')
        Cluster.addCluster(SrBasicCluster)
        this.log('+Cluster add SrBasicCluster: ', this.zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME])

        this.enableDebug();
        this.printNode();

        if (this.hasCapability('button.calibrate')) {
            await this.removeCapability('button.calibrate');
        }

        this.app_deleted = false
        this.curMode = 9
        await this.calibrateMode()

        this.zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', async value => {
            this.log(`-- rev swith 1 onoff = `, value)
            this.driver.triggerMyFlow(this, 1, value ? 'on' : 'off');
        })

        this.zclNode.endpoints[2].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', async value => {
            this.log(`-- rev swith 2 onoff = `, value)
            this.driver.triggerMyFlow(this, 2, value ? 'on' : 'off');
        })
    }

    async trunOnoffRunListener(args) {
        if (args.onoff === 1) {
            this.zclNode.endpoints[args.endpoint].clusters[CLUSTER.ON_OFF.NAME].setOn().catch(this.error)
        } else if (args.onoff === 0) {
            this.zclNode.endpoints[args.endpoint].clusters[CLUSTER.ON_OFF.NAME].setOff().catch(this.error)
        }
    }

    onDeleted() {
        super.onDeleted()

        this.log('++S728-ZG, Deleted.')

        this.app_deleted = true

    }


    async calibrateMode() {
        if (this.app_deleted) {
            return
        }
        try {
            await this.zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME].readAttributes(['swMode'])
            .then(value => {
                this.log('++read BASIC: ', value)
                if (value.hasOwnProperty('swMode')) {
                    this.curMode = value['swMode'];
                    this.setStoreValue('last_swmode', this.curMode)

                    this.initApp();
                }
            })
            .catch(err => {
                this.log('xxxxxxxxxxxxxxxxx err', err)
                if (err === "Could not reach device. Is it powered on?") {
                    return
                }
                if (err === "Error: timeout") {
                    return
                }
                this.log('获取模式参数: ', err);
                this.tipinfo = "" + err
                this.showMessage(this.tipinfo)

                this.homey.setTimeout(() => {
                    this.log('+++++++++++++++++++read calibrateMode', err)
                    this.calibrateMode()
                }, 5000)
            })
        } catch (error) {
            this.log('++read swMode: ', error)
            this.homey.setTimeout(() => {
                this.calibrateMode()
            }, 5000)
        }

    }


    async initApp() {

        if (this.app_deleted) {
            return
        }

        if (this.curMode === 9 || this.curMode === undefined) {
            console.log('xxxxxxxxxxxxx22222222')

            if (this.tipinfo === 'Error: node_object_not_found') {
                this.setWarning(this.tipinfo).catch(this.error);
                return
            }

            this.homey.setTimeout(async () => {
                this.calibrateMode()
            }, 6000)

            //erro icon
            this.showMessage(this.tipinfo).catch(this.error)
            return;
        }


        this.app_inited = false
        this.params = {}

        this.setAvailable();

        this.log('init App: ', this.curMode)

        await this.setSettings({
            swmode: "" + this.curMode
        }).catch(this.error)

        if (this.curMode === 0 || this.curMode === '0') {

            if (this.hasCapability('onoff')) {
                await this.removeCapability('onoff');
            }
            if (this.hasCapability('meter_power')) {
                await this.removeCapability('meter_power');
            }
            if (this.hasCapability('measure_power')) {
                await this.removeCapability('measure_power');
            }
            if (this.hasCapability('rms_voltage')) {
                await this.removeCapability('rms_voltage');
            }
            if (this.hasCapability('rms_current')) {
                await this.removeCapability('rms_current');
            }

            await this.addCapability('switch_1');
            await this.addCapability('switch_2');
            await this.addCapability('meter_power_1');
            await this.addCapability('measure_power_1');
            await this.addCapability('meter_power_2');
            await this.addCapability('measure_power_2');

            await this.addCapability('rms_voltage_1');
            await this.addCapability('rms_current_1');
            await this.addCapability('rms_voltage_2');
            await this.addCapability('rms_current_2');

            this.registerSwitchOnoff(1);
            this.registerMeterPowerMeasurePower(1);
            this.registerSwitchOnoff(2);
            this.registerMeterPowerMeasurePower(2);

            await this.registerRmsCurrent(1);
            await this.registerRmsVoltage(1);
            await this.registerRmsCurrent(2);
            await this.registerRmsVoltage(2);

        } else {

            if (this.hasCapability('switch_1')) {
                await this.removeCapability('switch_1');
            }
            if (this.hasCapability('switch_2')) {
                await this.removeCapability('switch_2');
            }
            if (this.hasCapability('meter_power_1')) {
                await this.removeCapability('meter_power_1');
            }
            if (this.hasCapability('measure_power_1')) {
                await this.removeCapability('measure_power_1');
            }
            if (this.hasCapability('meter_power_2')) {
                await this.removeCapability('meter_power_2');
            }
            if (this.hasCapability('measure_power_2')) {
                await this.removeCapability('measure_power_2');
            }

            if (this.hasCapability('rms_voltage_1')) {
                await this.removeCapability('rms_voltage_1');
            }
            if (this.hasCapability('rms_current_1')) {
                await this.removeCapability('rms_current_1');
            }
            if (this.hasCapability('rms_voltage_2')) {
                await this.removeCapability('rms_voltage_2');
            }
            if (this.hasCapability('rms_current_2')) {
                await this.removeCapability('rms_current_2');
            }


            await this.addCapability('onoff');
            await this.addCapability('meter_power');
            await this.addCapability('measure_power');
            await this.addCapability('rms_voltage');
            await this.addCapability('rms_current');
            this.registerSwitchOnoff(1);
            this.registerMeterPowerMeasurePower(1);
            await this.registerRmsVoltage(1)
            await this.registerRmsCurrent(1)
        }


        this._init_app()

    }

    async showMessage(msg) {
        await this.unsetWarning().catch(this.error)
        await this.setWarning(msg).catch(this.error)
    }
}

module.exports = S728zg_2gang_switch_Device;
