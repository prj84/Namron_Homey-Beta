'use strict';

const HzcZigBeeDriver = require('../../lib/HzcZigBeeDriver')

class s730_zg_zigbee_driver extends HzcZigBeeDriver {

    async onInit() {
        //
        await super.onInit()

        try {
            this.Temperature_2_NTC_sensor_changed = this.getDeviceTriggerCard('Temperature_2_NTC_sensor_changed')
            this.Temperature_1_NTC_sensor_changed = this.getDeviceTriggerCard('Temperature_1_NTC_sensor_changed')

            this.Set_NTC1_Temperature = this.getDeviceTriggerCard('Set_NTC1_Temperature')
            this.Set_NTC2_Temperature = this.getDeviceTriggerCard('Set_NTC2_Temperature')

            this.Water_sensor_triggered = this.getDeviceTriggerCard('Water_sensor_triggered')

            this.If_No_Water_Alarm = this.getDeviceTriggerCard('If_No_Water_Alarm')
            this.If_Water_Alarm = this.getDeviceTriggerCard('If_Water_Alarm')

            this.Set_NTC1_Temperature.registerRunListener(async (args, state) => {
                if (args.number !== undefined) {
                    if (args.compare === 'greater') {
                        return args.number < (args.device.hzc_tm_measured_1_value / 10)
                    } else {
                        return args.number > (args.device.hzc_tm_measured_1_value / 10)
                    }
                }
            })

            this.Set_NTC2_Temperature.registerRunListener(async (args, state) => {
                if (args.number !== undefined) {
                    if (args.compare === 'greater') {
                        return args.number < (args.device.hzc_tm_measured_2_value / 10)
                    } else {
                        return args.number > (args.device.hzc_tm_measured_2_value / 10)
                    }
                }
            })

        } catch (error) {
        }

        try {
            // this.Is_Turn_on_relay_NTC = this.getConditionCard('Is_Turn_on_relay_NTC')
            // this.Is_Turn_off_relay_NTC = this.getConditionCard('Is_Turn_off_relay_NTC')

            this.Set_NTC1_Temperature_Condition = this.getConditionCard('Set_NTC1_Temperature_Condition')
            this.Set_NTC2_Temperature_Condition = this.getConditionCard('Set_NTC2_Temperature_Condition')

            // this.Is_Turn_on_relay_NTC.registerRunListener(async (args) => {
            //     this.log('++++++++++++ Turn_on_relay_NTC turnOffRelay', args.device.getSetting('water_alarm_relay_action'))
            //     return args.device.getSetting('water_alarm_relay_action') === 'turnOnRelay'
            // });


            // this.Is_Turn_off_relay_NTC.registerRunListener(async (args) => {
            //     this.log('++++++++++++ Turn_off_relay_NTC')
            //     return args.device.getSetting('water_alarm_relay_action') === 'turnOffRelay'
            // });

            this.Set_NTC1_Temperature_Condition.registerRunListener(async (args, state) => {
                await this.log('___________Set_NTC1_Temperature_Condition', args.number, (args.device.hzc_tm_measured_1_value / 10), args.compare)
                if (args.compare === 'greater') {
                    return args.number < (args.device.hzc_tm_measured_1_value / 10)
                } else {
                    return args.number > (args.device.hzc_tm_measured_1_value / 10)
                }
            })

            this.Set_NTC2_Temperature_Condition.registerRunListener(async (args, state) => {
                await this.log('___________Set_NTC2_Temperature_Condition', args.number, (args.device.hzc_tm_measured_2_value / 10), args.compare)
                if (args.compare === 'greater') {
                    return args.number < (args.device.hzc_tm_measured_2_value / 10)
                } else {
                    return args.number > (args.device.hzc_tm_measured_2_value / 10)
                }
            })

        } catch (error) {

        }

        try {
            this.Turn_on_water_alarm = this.getActionCard('Turn_on_water_alarm')
            this.Turn_off_water_alarm = this.getActionCard('Turn_off_water_alarm')
            // this.Turn_on_relay_NTC = this.getActionCard('Turn_on_relay_NTC')
            // this.Turn_off_relay_NTC = this.getActionCard('Turn_off_relay_NTC')

            this.Turn_on_water_alarm.registerRunListener((args) => {
                this.log('++++++++++++ Turn_on_water_alarm')
                return args.device.switchUserInterfaceConfiguration().writeAttributes({waterSensorValue: true}).catch(this.error)
            })

            this.Turn_off_water_alarm.registerRunListener((args) => {
                this.log('++++++++++++ Turn_off_water_alarm')
                return args.device.switchUserInterfaceConfiguration().writeAttributes({waterSensorValue: false}).catch(this.error)
            })

            // this.Turn_on_relay_NTC.registerRunListener((args) => {
            //     this.log('++++++++++++ Turn_on_relay_NTC')
            //     args.device.setSettings({water_alarm_relay_action: 'turnOnRelay'})
            //     return args.device.switchUserInterfaceConfiguration().writeAttributes({waterAlarmRelayAction: 'turnOnRelay'}).catch(this.error)
            // })
            //
            // this.Turn_off_relay_NTC.registerRunListener((args) => {
            //     this.log('++++++++++++ Turn_off_relay_NTC')
            //     args.device.setSettings({water_alarm_relay_action: 'turnOffRelay'})
            //     return args.device.switchUserInterfaceConfiguration().writeAttributes({waterAlarmRelayAction: 'turnOffRelay'}).catch(this.error)
            // })

        } catch (error) {

        }
        try {
            this.Reset_condition_alarm = this.getActionCard('Reset_condition_alarm')
            this.Reset_condition_alarm.registerRunListener((args) => {
                this.log('++++++++++++ Reset_condition_alarm')
                return args.device.switchUserInterfaceConfiguration().setClear()
                    .then(() => {
                        this.log('++++++++++++ Reset_condition_alarm success')
                    })
                    .catch(() => {
                        this.log('++++++++++++ Reset_condition_alarm fail')
                    })
                    .catch(this.error)
            })
        } catch (e) {

        }
    }

    triggers_flow_NTC1_sensor_changed(device) {
        this.Temperature_1_NTC_sensor_changed.trigger(device).then().catch(this.error)
    }

    triggers_flow_NTC2_sensor_changed(device) {
        this.Temperature_2_NTC_sensor_changed.trigger(device).then().catch(this.error)
    }

    triggers_flow_water_sensor(device) {
        this.Water_sensor_triggered.trigger(device).then().catch(this.error)
    }

    triggers_flow_Water_Alarm(device) {
        this.If_Water_Alarm.trigger(device).then().catch(this.error)
    }

    triggers_flow_No_Water_Alarm(device) {
        this.If_No_Water_Alarm.trigger(device).then().catch(this.error)
    }

    triggers_flow_Set_NTC1_Temperature(device) {
        this.Set_NTC1_Temperature.trigger(device).then().catch(this.error)
    }

    triggers_flow_Set_NTC2_Temperature(device) {
        this.Set_NTC2_Temperature.trigger(device).then().catch(this.error)
    }
}

module.exports = s730_zg_zigbee_driver;