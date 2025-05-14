'use strict';

const Homey = require('homey');
const {setConfiguratrion} = require("./lib/devices/utils");


class WenkongDriver extends Homey.Driver {
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        try {
            this.zv_trunOnFrostCard = this.homey.flow.getActionCard('zv_turned_on_frost')
            this.zv_trunOnFrostCard.registerRunListener((args) => {
                return args.device.turnFrostRunListener({frost: true})
            })

            this.zv_trunOffFrostCard = this.homey.flow.getActionCard('zv_turned_off_frost')
            this.zv_trunOffFrostCard.registerRunListener((args) => {
                return args.device.turnFrostRunListener({frost: false})
            })

            this._setRegulatorPercentage = this.homey.flow.getActionCard('zv_set_regulator_percentage')
            this._setRegulatorPercentage.registerRunListener((args) => {
                return setConfiguratrion(args.device, null, 127, 4, false, args.number);
            })

        } catch (e) {

        }

        try {
            this.zv_trunOnFrostTrigger = this.homey.flow.getDeviceTriggerCard("zv_trigger_frost_turned_on");
            this.zv_trunOffFrostTrigger = this.homey.flow.getDeviceTriggerCard("zv_trigger_frost_turned_off");
            this._regulatorPercentageTrigger = this.homey.flow.getDeviceTriggerCard("zv_trigger_regulator_percentage");
        } catch (e) {

        }

    }

    triggerMyFlow(device, value) {
        this.log('zv_frost +++++++++++++++', this.homey.flow.getDeviceTriggerCard, value)
        if (value) {
            this.zv_trunOnFrostTrigger.trigger(device).then().catch(this.error);
        } else {
            this.zv_trunOffFrostTrigger.trigger(device).then().catch(this.error);
        }
    }

    triggerRegulator(device) {
        this._regulatorPercentageTrigger.trigger(device).then().catch(this.error);
    }

    /*
    if( device.hasCapability('dim') ) {
      return MyDeviceDim;
    } else {
      return MyDevice;
    }*/


    async onPair1(session) {

    }

    async onPairListDevices() {

    }
}

module.exports = WenkongDriver;