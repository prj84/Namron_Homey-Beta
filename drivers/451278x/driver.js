'use strict';

const HzcZigBeeDriver = require('../../lib/SrZigBeeDriver')

class t11_zg_Driver extends HzcZigBeeDriver {


    async onInit() {
        super.onInit()

        try {
            this._trunOnFrostCard = this.getActionCard('t11_turned_on_frost')
            this._trunOnFrostCard.registerRunListener((args, state) => {
                return args.device.turnFrostRunListener({frost: true}).catch(this.error)
            })

            this._trunOffFrostCard = this.getActionCard('t11_turned_off_frost')
            this._trunOffFrostCard.registerRunListener((args, state) => {
                return args.device.turnFrostRunListener({frost: false}).catch(this.error)
            })

            this._setRegulatorPercentage = this.getActionCard('t11_set_regulator_percentage')
            this._setRegulatorPercentage.registerRunListener((args, state) => {
                return args.device.thermostatCluster().writeAttributes({regulator_percentage: args.number}).catch(this.error)
            })

        } catch (e) {

        }

        try {
            this._trunOnFrostTrigger = this.getDeviceTriggerCard("t11_trigger_frost_turned_on");
            this._trunOffFrostTrigger = this.getDeviceTriggerCard("t11_trigger_frost_turned_off");
            this._regulatorPercentageTrigger = this.getDeviceTriggerCard("t11_trigger_regulator_percentage");
        } catch (e) {

        }

    }

    triggerMyFlow(device, value) {
        this.log('Zigbee frost +++++++++++++++', value)
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
module.exports = t11_zg_Driver;