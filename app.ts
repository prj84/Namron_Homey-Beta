import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();

import {Log} from 'homey-log';
import Homey, {FlowCardAction, FlowCardTriggerDevice} from 'homey';
import {debug} from 'zigbee-clusters';
import TuyaThermostatDevice from './lib/TuyaThermostatDevice';

interface FlowActionArgs {
    device: TuyaThermostatDevice;
}

interface ModeFlowActionArgs extends FlowActionArgs {
    mode: string;
}

interface SensorTypeFlowActionArgs extends FlowActionArgs {
    type: string;
}

// const Homey = require('homey')

class MyApp extends Homey.App {
    homeyLog: Log | undefined;

    saturationButtonModeG4TriggerCard: FlowCardTriggerDevice | undefined;
    hueMovedG4TriggerCard: FlowCardTriggerDevice | undefined;
    sceneButtonModeG4S7TriggerCard: FlowCardTriggerDevice | undefined;
    brightnessButtonTypeModeG4TriggerCard: FlowCardTriggerDevice | undefined;
    whiteButtonTypeModeG4TriggerCard: FlowCardTriggerDevice | undefined;
    whiteMovedG4TriggerCard: FlowCardTriggerDevice | undefined;
    onButtonPressedTriggerCard: FlowCardTriggerDevice | undefined;
    offButtonPressedTriggerCard: FlowCardTriggerDevice | undefined;
    brightnessTypeButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    switchButtonOnOffTriggerCard: FlowCardTriggerDevice | undefined;
    brightnessButtonModeZgTriggerCard: FlowCardTriggerDevice | undefined;
    onButtonModeG4TriggerCard: FlowCardTriggerDevice | undefined;
    offButtonModeG4TriggerCard: FlowCardTriggerDevice | undefined;
    sceneButtonModeS2ZgTriggerCard: FlowCardTriggerDevice | undefined;
    onButtonModeG2TriggerCard: FlowCardTriggerDevice | undefined;
    offButtonModeG2TriggerCard: FlowCardTriggerDevice | undefined;
    brightnessMovedTriggerCard: FlowCardTriggerDevice | undefined;
    hueMovedTriggerCard: FlowCardTriggerDevice | undefined;
    whiteMovedTriggerCard: FlowCardTriggerDevice | undefined;
    brightnessButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    switchButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    onButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    offButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    allOnButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    allOffButtonModeTriggerCard: FlowCardTriggerDevice | undefined;
    sceneButtonModeS2TriggerCard: FlowCardTriggerDevice | undefined;
    zwStartDimChangeV4ActionCard: FlowCardAction | undefined;
    zwStopDimChangeActionCard: FlowCardAction | undefined;
    sr4512744ThermostatModeActionCard: FlowCardAction | undefined;
    sr4512737ThermostatModeActionCard: FlowCardAction | undefined;

    onInit(): Promise<void> {
        this.log('MyApp is running...')

        this.homeyLog = new Log({homey: this.homey});

        if (Homey.env.DEBUG_ZB === '1') {
            debug(true);
        }

        this.setUpZigbeeFlowTriggerCards()
        this.setUpZigbeeFlowActionCards()
        this.setUpZwaveFlowTriggerCards()
        this.setUpZwaveFlowActionCards()


        // Register flow conditions
        this.homey.flow.getConditionCard('tuya_thermostat_load_status_condition')
            .registerRunListener((args: FlowActionArgs) => {
                return args.device.getCapabilityValue('tuya_thermostat_load_status');
            });
        this.homey.flow.getConditionCard('set_tuya_child_lock_condition')
            .registerRunListener((args: FlowActionArgs) => {
                return args.device.getCapabilityValue('tuya_child_lock');
            });

        // Register flow actions
        this.homey.flow.getActionCard('set_tuya_thermostat_mode')
            .registerRunListener((args: ModeFlowActionArgs) => {
                this.logActionTrigger('set_tuya_thermostat_mode');
                args.device.setMode(Number(args.mode)).catch(this.error);
            });
        this.homey.flow.getActionCard('set_tuya_thermostat_sensor_type_changed')
            .registerRunListener((args: SensorTypeFlowActionArgs) => {
                this.logActionTrigger('set_tuya_thermostat_sensor_type_changed');
                args.device.setSensorType(Number(args.type)).catch(this.error);
            });
        this.homey.flow.getActionCard('set_tuya_child_lock_true')
            .registerRunListener((args: FlowActionArgs) => {
                this.logActionTrigger('set_tuya_child_lock_true');
                args.device.setChildLock(true).catch(this.error);
            });
        this.homey.flow.getActionCard('set_tuya_child_lock_false')
            .registerRunListener((args: FlowActionArgs) => {
                this.logActionTrigger('set_tuya_child_lock_false');
                args.device.setChildLock(false).catch(this.error);
            });
        this.homey.flow.getActionCard('toggle_tuya_child_lock')
            .registerRunListener((args: FlowActionArgs) => {
                this.logActionTrigger('toggle_tuya_child_lock');
                args.device.setChildLock(!args.device.getCapabilityValue('tuya_child_lock')).catch(this.error);
            });

        // const manifest = Homey.manifest
        // this.log(manifest.flow.triggers[6])
        return Promise.resolve();


    }

    private logActionTrigger(action: string): void {
        this.log('Triggered flow action', action);
    }

    // Register Flow Actions
    setUpZigbeeFlowTriggerCards() {

        //this.switchButtonOnOffG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
        //  'sr_switch_button_on_off_g4')
        //this.switchButtonOnOffG4TriggerCard.registerRunListener(
        //  async (args, state) => {
        //    return args.group === state.group && args.mode === state.mode
        //  })

        this.saturationButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_saturation_button_mode_g4')
        this.saturationButtonModeG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.mode === state.mode
            })

        this.hueMovedG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_hue_moved_g4')
        this.hueMovedG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group
            })

        this.sceneButtonModeG4S7TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_scene_button_mode_g4_s7')
        this.sceneButtonModeG4S7TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.scene === state.scene &&
                    args.mode === state.mode
            })

        this.brightnessButtonTypeModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_brightness_button_type_mode_g4')
        this.brightnessButtonTypeModeG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.type === state.type &&
                    args.mode === state.mode
            })

        this.whiteButtonTypeModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_white_button_type_mode_g4')
        this.whiteButtonTypeModeG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.type === state.type &&
                    args.mode === state.mode
            })

        this.whiteMovedG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_white_moved_g4')
        this.whiteMovedG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group
            })

        this.onButtonPressedTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_on_button_pressed')
        this.onButtonPressedTriggerCard.registerRunListener(
            async (args, state) => {
                return true
            })

        this.offButtonPressedTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_off_button_pressed')
        this.offButtonPressedTriggerCard.registerRunListener(
            async (args, state) => {
                return true
            })

        this.brightnessTypeButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_brightness_type_button_mode')
        this.brightnessTypeButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.type === state.type && args.mode === state.mode
            })

        this.switchButtonOnOffTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_switch_button_on_off')
        this.switchButtonOnOffTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.brightnessButtonModeZgTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_brightness_button_mode_zg')
        this.brightnessButtonModeZgTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.onButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_on_button_mode_g4')
        this.onButtonModeG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.mode === state.mode
            })

        this.offButtonModeG4TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_off_button_mode_g4')
        this.offButtonModeG4TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.mode === state.mode
            })

        this.sceneButtonModeS2ZgTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_scene_button_mode_s2_zg')
        this.sceneButtonModeS2ZgTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode && args.scene === state.scene
            })

        this.onButtonModeG2TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_on_button_mode_g2')
        this.onButtonModeG2TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.mode === state.mode
            })

        this.offButtonModeG2TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_off_button_mode_g2')
        this.offButtonModeG2TriggerCard.registerRunListener(
            async (args, state) => {
                return args.group === state.group && args.mode === state.mode
            })

        this.brightnessMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_brightness_moved')
        this.brightnessMovedTriggerCard.registerRunListener(
            async (args, state) => {
                return true
            })

        this.hueMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_hue_moved')
        this.hueMovedTriggerCard.registerRunListener(
            async (args, state) => {
                return true
            })

        this.whiteMovedTriggerCard = this.homey.flow.getDeviceTriggerCard('sr_white_moved')
        this.whiteMovedTriggerCard.registerRunListener(
            async (args, state) => {
                return true
            })
    }

    setUpZigbeeFlowActionCards() {
        this.sr4512737ThermostatModeActionCard = this.homey.flow.getActionCard('sr_4512737_thermostat_mode')
        this.sr4512737ThermostatModeActionCard.registerRunListener(async (args, state) => {
            // args { device, mode }
            // state { manual }, ignore this.
            return args.device.setThermostatMode(args.mode)
        })
    }

    setUpZwaveFlowTriggerCards() {

        this.brightnessButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_brightness_button_mode')
        this.brightnessButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.switchButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_switch_button_mode')
        this.switchButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.onButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_on_button_mode')
        this.onButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.offButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_off_button_mode')
        this.offButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        // 'sr_brightness_type_button_mode' exists in the Zigbee flow

        this.allOnButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_all_on_button_mode')
        this.allOnButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        this.allOffButtonModeTriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_all_off_button_mode')
        this.allOffButtonModeTriggerCard.registerRunListener(
            async (args, state) => {
                return args.mode === state.mode
            })

        // 'sr_on_button_mode_g4' exists in the Zigbee flow
        // 'sr_off_button_mode_g4' exists in the Zigbee flow

        this.sceneButtonModeS2TriggerCard = this.homey.flow.getDeviceTriggerCard(
            'sr_scene_button_mode_s2')
        this.sceneButtonModeS2TriggerCard.registerRunListener(
            async (args, state) => {
                return args.scene === state.scene && args.mode === state.mode
            })

        // 'sr_on_button_mode_g2' exists in the Zigbee flow
        // 'sr_off_button_mode_g2' exists in the Zigbee flow
    }

    //Register Flow Action cards
    setUpZwaveFlowActionCards() {

        this.zwStartDimChangeV4ActionCard = this.homey.flow.getActionCard('sr_zw_start_dim_change_v4')
        this.zwStartDimChangeV4ActionCard.registerRunListener(async (args, state) => {
            return args.device.startDimChange(args, state)
        })

        this.zwStopDimChangeActionCard = this.homey.flow.getActionCard('sr_zw_stop_dim_change')
        this.zwStopDimChangeActionCard.registerRunListener(async (args, state) => {
            return args.device.stopDimChange(args, state)
        })

        this.sr4512744ThermostatModeActionCard = this.homey.flow.getActionCard('sr_4512744_thermostat_mode')
        this.sr4512744ThermostatModeActionCard.registerRunListener(async (args, state) => {
            // args { device, mode }
            // state { manual }, ignore this.
            return args.device.setThermostatMode(args.mode)
        })
    }

}

module.exports = MyApp
