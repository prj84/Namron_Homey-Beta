'use strict'

const { CLUSTER } = require('zigbee-clusters')

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster')
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster')

const ZigBeeRemoteControl = require('../../lib/ZigBeeRemoteControl')

const SrUtils = require('../../lib/SrUtils')

class RemoteControl extends ZigBeeRemoteControl {

  async onNodeInit ({ zclNode, node }) {
    await super.onNodeInit({ zclNode, node })

    // Flows

    Object.keys(this.zclNode.endpoints).forEach((endpoint) => {

      this.zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME,
        new OnOffBoundCluster({
          onSetOff: this._onOffCommandHandler.bind(this, '4512702_off'),
          onSetOn: this._onOffCommandHandler.bind(this, '4512702_on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onStepWithOnOff: this._onLevelStepWithOnOff.bind(this),
          onStopWithOnOff: this._onLevelStopWithOnOff.bind(this),
          onMoveWithOnOff: this._onLevelMoveWithOnOff.bind(this),
          endpoint: endpoint,
        }))

    })

    this.brightnessType = 'up'
  }

  _onOffCommandHandler (type, endpoint) {

    this.log(
      `_onOffCommandHandler => ${type}, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard(type).trigger(this, tokens, state).catch(this.error)

    if (type === '4512702_off') {

      this.homey.app.offButtonPressedTriggerCard.trigger(this, null, null).catch(this.error)

    } else if (type === '4512702_on') {

      this.homey.app.onButtonPressedTriggerCard.trigger(this, null, null).catch(this.error)
    }
  }

  _onLevelStepWithOnOff ({ mode, stepSize, transitionTime }, endpoint) {

    const tokens = {
      'mode': SrUtils.getStepLevelModeToken(mode),
      'step_size': SrUtils.getStepLevelStepSizeToken(stepSize),
      'transition_time': Math.floor(transitionTime / 10),
    }
    this.log(
      `_onLevelStepWithOnOff ${mode} ${stepSize} ${transitionTime}, ${endpoint}`)
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512702_level_step_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    if (mode === 'up') {

      this.homey.app.brightnessTypeButtonModeTriggerCard.
        trigger(this, tokens, { 'type': 'up', 'mode': 'pressed' }).catch(this.error)

    } else if (mode === 'down') {

      this.homey.app.brightnessTypeButtonModeTriggerCard.
        trigger(this, tokens, { 'type': 'down', 'mode': 'pressed' }).catch(this.error)
    }
  }

  _onLevelMoveWithOnOff ({ moveMode, rate }, endpoint) {

    this.log(
      `_onLevelMoveWithOnOff ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveLevelMoveModeToken(moveMode),
      'rate': SrUtils.getMoveLevelRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512702_level_move_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.moveMode = moveMode

    if (moveMode === 'up') {

      this.homey.app.brightnessTypeButtonModeTriggerCard.
        trigger(this, tokens, { 'type': 'up', 'mode': 'held_down' }).catch(this.error)

    } else if (moveMode === 'down') {

      this.homey.app.brightnessTypeButtonModeTriggerCard.
        trigger(this, tokens, { 'type': 'down', 'mode': 'held_down' }).catch(this.error)
    }
  }

  _onLevelStopWithOnOff (endpoint) {

    this.log(
      `_onLevelStopWithOnOff ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512702_level_stop_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.brightnessTypeButtonModeTriggerCard.
      trigger(this, null, { 'type': this.moveMode, 'mode': 'released' }).catch(this.error)

  }

}

module.exports = RemoteControl

/**

 1 Groups

 Input clusters:
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 Output clusters:
 Identify, On/Off, Level control, Ota
 [3, 6, 8, 25]

 */
