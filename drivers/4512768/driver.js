'use strict';

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class switch_2gang_s728zg_driver extends SrZigBeeDriver {
    onInit () {
        super.onInit()

        try {
            this._trunOnoffActionCard = this.getActionCard('action_switch_with_onoff')
            this._trunOnoffActionCard.registerRunListener((args, state) => {
                this.log('call trunOnoffRunListener')
                return args.device.trunOnoffRunListener(args, state).catch(this.error)
            })


            this._turnOnActionCard1 = this.getActionCard('action_switch_turned_on_for_switch_1')
            this._turnOffActionCard1 = this.getActionCard('action_switch_turned_off_for_switch_1')
            this._turnOnActionCard2 = this.getActionCard('action_switch_turned_on_for_switch_2')
            this._turnOffActionCard2 = this.getActionCard('action_switch_turned_off_for_switch_2')

            this._turnOnActionCard1.registerRunListener( (args, state) => {
                let playload = { onoff: 1, endpoint:1 }
                return args.device.trunOnoffRunListener(playload, state).catch(this.error)
            })

            this._turnOffActionCard1.registerRunListener( (args, state) => {
                let playload = { onoff: 0, endpoint:1 }
                return args.device.trunOnoffRunListener(playload, state).catch(this.error)
            })

            this._turnOnActionCard2.registerRunListener( (args, state) => {
                let playload = { onoff: 1, endpoint:2 }
                return args.device.trunOnoffRunListener(playload, state).catch(this.error)
            })

            this._turnOffActionCard2.registerRunListener( (args, state) => {
                let playload = { onoff: 0, endpoint:2 }
                return args.device.trunOnoffRunListener(playload, state).catch(this.error)
            })
        } catch (error) {

        }

        try{
            this._turnOn1Trigger = this.getDeviceTriggerCard("trigger_switch_2gang_turned_on_1");
            this._turnOn2Trigger = this.getDeviceTriggerCard("trigger_switch_2gang_turned_on_2");
            this._turnOff1Trigger = this.getDeviceTriggerCard("trigger_switch_2gang_turned_off_1");
            this._turnOff2Trigger = this.getDeviceTriggerCard("trigger_switch_2gang_turned_off_2");

        }catch(error){

        }

    }

    triggerMyFlow(device, switchNo, onoff) {
        this.log('+++triggerMyFlow112: ', switchNo, onoff)
        if (switchNo == 1 && onoff == 'on'){
            this._turnOn1Trigger.trigger(device).then(this.log).catch(this.error);
        } else if (switchNo == 1 && onoff == 'off'){
            this._turnOff1Trigger.trigger(device).then(this.log).catch(this.error);
        }
        else if (switchNo == 2 && onoff == 'on'){
            this._turnOn2Trigger.trigger(device).then(this.log).catch(this.error);
        } else if (switchNo == 2 && onoff == 'off'){
            this._turnOff2Trigger.trigger(device).then(this.log).catch(this.error);
        }
    }
}

module.exports = switch_2gang_s728zg_driver;