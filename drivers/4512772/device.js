'use strict'

const { CLUSTER } = require('zigbee-clusters')

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster')
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster')

const ZigBeeRemoteControl = require('../../lib/ZigBeeRemoteControl')

const SrUtils = require('../../lib/SrUtils')

class RemoteControl extends ZigBeeRemoteControl {

  async onNodeInit ({ zclNode, node }) {
    await super.onNodeInit({ zclNode, node })

    this.enableDebug()
    this.printNode()
    // Flows

    Object.keys(this.zclNode.endpoints).forEach((endpoint) => {

      this.zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME,
        new OnOffBoundCluster({
          onSetOff: this._onOffCommandHandler.bind(this, '4512772_off'),
          onSetOn: this._onOffCommandHandler.bind(this, '4512772_on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onStopWithOnOff: this._onLevelStopWithOnOff.bind(this),
          onStop: this._onLevelStopWithOnOff.bind(this),
          onMoveWithOnOff: this._onLevelMoveWithOnOff.bind(this),
          onMove: this._onLevelMoveWithOnOff.bind(this),
          endpoint: endpoint,
        }))

    })

    this.isOn = true

  }

  _onOffCommandHandler (type, endpoint) {
    const triggerId = '_onOffCommandHandler'
    if (this.isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this.setupRepeatTimer(triggerId)

    this.log(
      `_onOffCommandHandler => ${type}, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }

    if (type === '4512772_off') {

      this.homey.app.offButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'pressed' }).
        catch(this.error)

    } else if (type === '4512772_on') {

      this.homey.app.onButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'pressed' }).
        catch(this.error)
    }
  }

  _onLevelMoveWithOnOff ({ moveMode, rate }, endpoint) {
    const triggerId = '_onLevelMoveWithOnOff'
    if (this.isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this.setupRepeatTimer(triggerId)

    this.log(
      `_onLevelMoveWithOnOff ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveLevelMoveModeToken(moveMode),
      'rate': SrUtils.getMoveLevelRateToken(rate),
    }
    const state = { 'group': endpoint }

    if (moveMode === 'up') {

      this.isOn = true
      this.homey.app.onButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'held_down' }).
        catch(this.error)

    } else if (moveMode === 'down') {

      this.isOn = false
      this.homey.app.offButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'held_down' }).
        catch(this.error)
    }
  }

  _onLevelStopWithOnOff (endpoint) {
    const triggerId = '_onLevelStopWithOnOff'
    if (this.isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this.setupRepeatTimer(triggerId)

    this.log(
      `_onLevelStopWithOnOff, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }

    if (this.isOn) {

      this.homey.app.onButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'released' }).
        catch(this.error)

    } else {

      this.homey.app.offButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'released' }).
        catch(this.error)
    }
  }

}

module.exports = RemoteControl

/**

 4 Groups

 Input clusters:
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 Output clusters:
 Identify, Groups, On/Off, Level control, Ota
 [3, 4, 6, 8, 25]

 */
