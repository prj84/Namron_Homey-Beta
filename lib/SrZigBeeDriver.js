'use strict'

const Homey = require('homey')

class SrZigBeeDriver extends Homey.Driver {

  getDeviceTriggerCard (flowId) {
    const card = this.homey.flow.getDeviceTriggerCard(flowId)
    if (card) {
      return card
    }
    throw Error(`No ${flowId} device trigger card found`)
  }

  getActionCard (flowId) {
    const card = this.homey.flow.getActionCard(flowId)
    if (card) return card
    throw Error(`No ${flowId} action card found`)
  }

  // 20210607 new flow cards

  // getSwitchButtonOnOffG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_switch_button_on_off_g4')
  // }
  //
  // getSaturationButtonModeG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_saturation_button_mode_g4')
  // }
  //
  // getHueMovedG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_hue_moved_g4')
  // }
  //
  // getSceneButtonModeG4S7TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_scene_button_mode_g4_s7')
  // }
  //
  // getBrightnessButtonTypeModeG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_brightness_button_type_mode_g4')
  // }
  //
  // getWhiteButtonTypeModeG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_white_button_type_mode_g4')
  // }
  //
  // getWhiteMovedG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_white_moved_g4')
  // }
  //
  // getOnButtonPressedTriggerCard () {
  //   return this.getDeviceTriggerCard('sr_on_button_pressed')
  // }
  //
  // getOffButtonPressedTriggerCard () {
  //   return this.getDeviceTriggerCard('sr_off_button_pressed')
  // }
  //
  // getBrightnessTypeButtonModeTriggerCard () {
  //   return this.getDeviceTriggerCard('sr_brightness_type_button_mode')
  // }
  //
  // getSwitchButtonOnOffTriggerCard () {
  //   return this.getDeviceTriggerCard('sr_switch_button_on_off')
  // }
  //
  // getBrightnessButtonModeZgTriggerCard () {
  //   return this.getDeviceTriggerCard('sr_brightness_button_mode_zg')
  // }
  //
  // getOnButtonModeG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_on_button_mode_g4')
  // }
  //
  // getOffButtonModeG4TriggerCard () {
  //   return this.getDeviceTriggerCard('sr_off_button_mode_g4')
  // }
  //
  // getSceneButtonModeS2TriggerCard() {
  //   return this.getDeviceTriggerCard('sr_scene_button_mode_s2_zg')
  // }

}

module.exports = SrZigBeeDriver
