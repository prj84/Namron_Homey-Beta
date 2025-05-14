const HzcDimmerZigBeeDevice = require('../../lib/HzcDimmerZigBeeDevice')
const HzcOnOffCluster = require('../../lib/HzcOnoffCluster')
const HzcDimmerZigbeeCluster = require('../../lib/HzcDimmerZigbeeCluster')
const {Cluster, CLUSTER} = require("zigbee-clusters");
Cluster.addCluster(HzcOnOffCluster)
Cluster.addCluster(HzcDimmerZigbeeCluster)
const MAX_DIM = 254;
class DimmerDevice extends HzcDimmerZigBeeDevice {
    async onNodeInit({zclNode}) {

        if (!this.hasCapability('measure_power')) {
            await this.addCapability('measure_power')
        }

        if (!this.hasCapability('meter_power_1')) {
            await this.addCapability('meter_power_1')
        }

        if (!this.hasCapability('rms_current')) {
            await this.addCapability('rms_current')
        }

        if (!this.hasCapability('rms_voltage')) {
            await this.addCapability('rms_voltage')
        }

        if (!this.hasCapability('onoff')) {
            await this.addCapability('onoff');
        }

        if (!this.hasCapability('dim')) {
            await this.addCapability('dim');
        }

        this.timer = 0
        await this.registerMeterPowerMeasurePower(1)
        await this.registerSwitchOnoff()
        await this.registerDim()

        await this._init_app()

        this.onOffCluster()
            .readAttributes(['start_up_on_off'])
            .then((value) => {
                this.log('_____________read start_up_on_off ', value)
                this.setSettings({start_up_on_off: value.start_up_on_off || 'off'}).catch(this.error)
            })
            .catch(err => {
                this.error(err)
            })

         this.levelControlCluster()
            .readAttributes(['defaultMoveRate', 'outEdge',  'minBrightness', 'onLevel2'])
            .then(async (value) => {
                this.log('defaultMoveRate ++++', value)
                if (value['defaultMoveRate']) {
                    this.setSettings({defaultMoveRate: value['defaultMoveRate'].toString()}).catch(this.error)
                }
                if (value['outEdge']) {
                    this.setSettings({outEdge: value['outEdge']}).catch(this.error)
                }

                if (value['minBrightness']) {
                    console.log("minBrightness", value['minBrightness']);
                    await this.initMinBrightnessSetting(value['minBrightness'])
                    this.initReport()
                }
                if (value['onLevel2']) {
                    this.initLevelSetting(value['onLevel2'])
                }
            })
            .catch(this.error)




    }

    initLevelSetting(value) {
        if (value === 255) {
            this.setSettings({onLevel2: 0,  }).catch(this.error)
        } else {
            this.setSettings({onLevel2: parseInt(value / 2.54),  }).catch(this.error)
        }
    }

    async initMinBrightnessSetting(value) {
        await this.setStoreValue('minBrightness', value)
        await this.setSettings({minBrightness: value }).catch(this.error)
    }

    initReport() {
        this.levelControlCluster().on('attr.outEdge', async value => {
            this.log('==========report outEdge: ', value)
            this.setSettings({outEdge: value}).catch(this.error)
        })
        this.levelControlCluster().on('attr.minBrightness', async value => {
            this.log('==========report minBrightness: ', value)
            this.initMinBrightnessSetting(value)
        })
        this.levelControlCluster().on('attr.onLevel2', async value => {
            this.log('==========report onLevel2: ', value)
            this.initLevelSetting(value)
        })
        this.onOffCluster().on('attr.onOff', async value => {
            if (value) {
                const {currentLevel} = await this.zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].readAttributes(
                    ['currentLevel']).catch(this.error)

                this.log('dim +++++++++++++++++++++', currentLevel)
                if (this.hasCapability('onoff')) {
                    if (this.getCapabilityValue('onoff') === true) {
                        this.adjustDimValue(currentLevel)
                    }
                }
            }
        })
        this.levelControlCluster().on('attr.currentLevel', async value => {
            this.adjustDimValue(value)
        })

        this.loopReadLevel()
    }

    loopReadLevel() {
        this.timer = setInterval(() => {
            this.levelControlCluster().readAttributes(['currentLevel', 'minBrightness']).then(value => {
                if (value.hasOwnProperty('currentLevel')) {
                    this.adjustDimValue(value['currentLevel'])
                }
                if (value.hasOwnProperty('minBrightness')) {
                    this.initMinBrightnessSetting(value['minBrightness'])
                }
            }).catch(this.error)
        }, 2000)
    }


    adjustDimValue(value) {
        const onOff = this.getCapabilityValue('onoff')
        if (!onOff) {
            this.setCapabilityValue('dim', 0).catch(this.error)
            return true
        }

        let hasMinBrightness = false
        let deviceMinBrightness = 0
        let minBrightness = this.getStoreValue('minBrightness') || 1
        if ( minBrightness > 0) {
            hasMinBrightness = true
            deviceMinBrightness = Math.round(minBrightness / 100 * MAX_DIM)
        }
        // this.log('hasMinBrightness: ', { value, minBrightness: minBrightness, deviceMinBrightness })
        if (hasMinBrightness && value > 0 && value <= deviceMinBrightness) {
            this.setCapabilityValue('dim', deviceMinBrightness / MAX_DIM).catch(this.error)
            return true
        } else {
            this.setCapabilityValue('dim', value / MAX_DIM).catch(this.error)
        }
    }
    async onSettings({oldSettings, newSettings, changedKeys}) {
        this.log(oldSettings, newSettings, changedKeys);
        await this.saveSettings(newSettings, changedKeys);
    };

    async saveSettings(newSettings, changedKeys) {
        changedKeys.forEach(element => {
            if (element === 'start_up_on_off') {
                this.onOffCluster().writeAttributes({start_up_on_off: newSettings[element]}).catch(this.error)
            } else if (element === 'outEdge') {
                this.levelControlCluster().writeAttributes({outEdge: newSettings[element]}).catch(this.error)
            } else if (element === 'defaultMoveRate') {
                this.levelControlCluster().writeAttributes({defaultMoveRate: Number(newSettings[element])}).catch(this.error)
            }  else if (element === 'minBrightness') {
                this.levelControlCluster().writeAttributes({minBrightness: parseInt(newSettings[element] )}).catch(this.error)
            } else if (element === 'onLevel2') {
                if (newSettings[element] === 0) {
                    this.levelControlCluster().writeAttributes({onLevel2: 255}).catch(this.error)
                } else {
                    this.levelControlCluster().writeAttributes({onLevel2: parseInt(newSettings[element] * 2.54)}).catch(this.error)
                }
            }
        })
    };

    onDeleted() {
        super.onDeleted()
        clearInterval(this.timer)
        this.log("D726_zg_smartplug_zb_Device, channel ", " removed")
    }
}

module.exports = DimmerDevice;
