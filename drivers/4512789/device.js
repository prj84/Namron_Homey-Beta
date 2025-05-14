'use strict'

const {Cluster} = require("zigbee-clusters");
const HzcSwitch2GangZigBeeDevice = require('../../lib/HzcSwitch2GangZigBeeDevice')
const HzcOnOffCluster = require('../../lib/HzcOnoffCluster')
const appkit = require("./lib");
Cluster.addCluster(HzcOnOffCluster)

class S729_ZG_Device extends HzcSwitch2GangZigBeeDevice {

    async onNodeInit({zclNode, node}) {
        await super.onNodeInit({zclNode, node})
        this.app_inited = false
        this.params = {}
        await this.addCapability('onoff');
        await this.addCapability('meter_power');
        await this.addCapability('measure_power');
        await this.addCapability('rms_voltage')
        await this.addCapability('rms_current')
        await this.addCapability('ac_alarm')
        await this.addCapability('device_temperature_alarm')
        await this.registerSwitchOnoff(1)
        await this.registerMeterPowerMeasurePower(1)
        await this.registerRmsVoltage(1)
        await this.registerRmsCurrent(1)
        this.registerAcAlarm()
        this.registerDeviceTemperatureAlarm()
        await this._init_app()
        this.onoffCluster(1)
        .readAttributes(['start_up_on_off'])
        .then((value) => {
            this.log('_____________read start_up_on_off ', value)
            this.setSettings({start_up_on_off: value.start_up_on_off || 'off'})
        })
        .catch(err => {
            this.error(err)
        })

    }

    async onSettings({oldSettings, newSettings, changedKeys}) {
        this.log(oldSettings, newSettings, changedKeys);
        await this.saveSettings(newSettings, changedKeys);
    };

    async saveSettings(newSettings, changedKeys) {

        changedKeys.forEach(element => {
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

    onDeleted() {
        super.onDeleted()
        this.log("S729-ZG, channel ", " removed")
    }
}

module.exports = S729_ZG_Device;