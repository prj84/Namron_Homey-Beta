const HzcDimmerZigBeeDevice = require('../../lib/SrDimmerZigBeeDevice')
const {Cluster} = require("zigbee-clusters");
const HzcDimmerZigbeeCluster = require('../../lib/SrDimmerZigbeeCluster')
const appkit = require("./lib");
Cluster.addCluster(HzcDimmerZigbeeCluster)

class DimmerPowerDevice extends HzcDimmerZigBeeDevice {
    async onNodeInit({zclNode}) {

        this.app_inited = false
        this.params = {}

        if (!this.hasCapability('onoff')) {
            await this.addCapability('onoff');
        }
        if (!this.hasCapability('dim')) {
            await this.addCapability('dim');
        }

        //add measure power
        if (!this.hasCapability('measure_power')) {
            await this.addCapability('measure_power')
        }

        //add meter
        if (!this.hasCapability('meter_power')) {
            await this.addCapability('meter_power')
        }

        //way 2
        await this.registerSwitchOnoff()
        await this.registerDim()
        await this.registerMeterPowerMeasurePower(1)
        await this._init_app()
        await this._getAttributes()
        await this._onHandlerReport()
    }

    async onSettings({oldSettings, newSettings, changedKeys}) {
        this.log(oldSettings, newSettings, changedKeys);
        await this.saveSettings(newSettings, changedKeys);
    };

    async saveSettings(newSettings, changedKeys) {
        changedKeys.forEach(element => {
            this.log("-----------------------config:", newSettings, element);
            let theElement = element;
            let theValue = newSettings[element];
            let o = appkit[theElement];
            if (o != undefined) {
                if (o['setConfig']) {
                    o.setConfig(this, theValue);
                }
            }
        })
    };

    async _getAttributes() {
        try {
            this.levelControlCluster()
            .readAttributes(['initialBrightness', 'minimumBrightness', 'screenConstantTime', 'backlight'])
            .then(value => {
                this.log('initialBrightness++++++++++++++++++++++', value)
                if (value['initialBrightness']) {
                    if (value['initialBrightness'] === 255) {
                        this.setSettings({initialBrightness: 0}).catch(this.error)
                    } else {
                        this.setSettings({initialBrightness: parseInt((value['initialBrightness'] / 2.54))}).catch(this.error)
                    }
                }

                if (value['minimumBrightness']) {
                    this.setSettings({minimumBrightness: value['minimumBrightness'] || 1}).catch(this.error)
                }

                if (value['screenConstantTime']) {
                    this.setSettings({screenConstantTime: value['screenConstantTime'].toString() || '0'}).catch(this.error)
                }

                if (value['backlight']) {
                    this.setSettings({backlight: value['backlight'] || 50}).catch(this.error)
                }
            })
            .catch(err => {
                this.error(err)
            })
        } catch (e) {
            await this.showWarnMessage("Error: Device is not responding, make sure the device has power.")
        }

    };

    async _onHandlerReport() {
        this.levelControlCluster()
        .on('attr.initialBrightness', value => {
            this.log('initialBrightness---------------', value)

            if (value === 255) {
                this.setSettings({initialBrightness: 0}).catch(this.error)
            } else {
                this.setSettings({initialBrightness: parseInt((value / 2.54))}).catch(this.error)
            }
        })

        this.levelControlCluster()
        .on('attr.minimumBrightness', value => {
            this.log('minimumBrightness---------------', value)
            this.setSettings({minimumBrightness: value}).catch(this.error)
        })

        this.levelControlCluster()
        .on('attr.screenConstantTime', value => {
            this.log('screenConstantTime---------------', value)
            this.setSettings({screenConstantTime: value.toString()}).catch(this.error)
        })

        this.levelControlCluster()
        .on('attr.backlight', value => {
            this.log('backlight---------------', value)
            this.setSettings({backlight: value}).catch(this.error)
        })
    }

}

module.exports = DimmerPowerDevice;