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
          onSetOff: this._onOffCommandHandler.bind(this, '4512701_off'),
          onSetOn: this._onOffCommandHandler.bind(this, '4512701_on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onStopWithOnOff: this._onLevelStopWithOnOff.bind(this),
          onMoveWithOnOff: this._onLevelMoveWithOnOff.bind(this),
          endpoint: endpoint,
        }))

    })
  }

  _onOffCommandHandler (type, endpoint) {

    this.log(
      `_onOffCommandHandler => ${type}, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard(type).trigger(this, tokens, state).catch(this.error)

    if (type === '4512701_off') {

      this.homey.app.switchButtonOnOffTriggerCard.trigger(this, tokens,
        { 'mode': 'off' }).catch(this.error)

    } else if (type === '4512701_on') {

      this.homey.app.switchButtonOnOffTriggerCard.trigger(this, tokens,
        { 'mode': 'on' }).catch(this.error)
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
    this.driver.getDeviceTriggerCard('4512701_level_move_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    if (moveMode === 'up') {

      this.homey.app.brightnessButtonModeZgTriggerCard.
        trigger(this, tokens, { 'mode': 'up' }).catch(this.error)

    } else if (moveMode === 'down') {

      this.homey.app.brightnessButtonModeZgTriggerCard.
        trigger(this, tokens, { 'mode': 'down' }).catch(this.error)
    }
  }

  _onLevelStopWithOnOff (endpoint) {

    this.log(
      `_onLevelStopWithOnOff, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512701_level_stop_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.brightnessButtonModeZgTriggerCard.
      trigger(this, tokens, { 'mode': 'stop' }).catch(this.error)
  }

}

module.exports = RemoteControl

/**

 (70100001)SR-ZG9001K2-DIM instruction

 1 Group

 # Input clusters
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 # Output clusters
 Identify, On/Off, Level Control, Ota
 [3, 6, 8, 25]

 */
