'use strict';

const HzcZigBeeDriver = require('../../lib/SrZigBeeDriver')


class t7e_zg_Driver extends HzcZigBeeDriver {

    async onInit() {
        super.onInit()

        try {
            this._trunOnFrostCard = this.getActionCard('turned_on_frost')
            this._trunOnFrostCard.registerRunListener((args, state) => {
                return args.device.turnFrostRunListener({frost: true})
            })

            this._trunOffFrostCard = this.getActionCard('turned_off_frost')
            this._trunOffFrostCard.registerRunListener((args, state) => {
                return args.device.turnFrostRunListener({frost: false})
            })

            this._setRegulatorPercentage = this.getActionCard('set_regulator_percentage')
            this._setRegulatorPercentage.registerRunListener((args, state) => {
                return args.device.thermostatCluster().writeAttributes({pIHeatingDemand: args.number}).catch(this.error)
            })

        } catch (e) {

        }

        try {
            this._trunOnFrostTrigger = this.getDeviceTriggerCard("trigger_frost_turned_on");
            this._trunOffFrostTrigger = this.getDeviceTriggerCard("trigger_frost_turned_off");
            this._regulatorPercentageTrigger = this.getDeviceTriggerCard("trigger_regulator_percentage");
        } catch (e) {

        }
    }

    triggerMyFlow(device, value) {
        if (value) {
            this._trunOnFrostTrigger.trigger(device).then().catch(this.error);
        } else {
            this._trunOffFrostTrigger.trigger(device).then().catch(this.error);
        }
    }

    triggerRegulator(device) {
        this._regulatorPercentageTrigger.trigger(device).then().catch(this.error);
    }

}

module.exports = t7e_zg_Driver;