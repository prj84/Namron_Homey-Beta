'use strict'

const { CLUSTER, Cluster } = require('zigbee-clusters')

const SrColorControlCluster = require('../../lib/SrColorControlCluster')

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster')
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster')
const ColorControlBoundCluster = require('../../lib/ColorControlBoundCluster')

const ZigBeeRemoteControl = require('../../lib/ZigBeeRemoteControl')

const SrUtils = require('../../lib/SrUtils')

Cluster.addCluster(SrColorControlCluster)

class RemoteControl extends ZigBeeRemoteControl {

  async onNodeInit ({ zclNode, node }) {
    await super.onNodeInit({ zclNode, node })

    // Flows

    Object.keys(this.zclNode.endpoints).forEach((endpoint) => {

      this.zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME,
        new OnOffBoundCluster({
          onSetOff: this._onOffCommandHandler.bind(this, '4512726_off'),
          onSetOn: this._onOffCommandHandler.bind(this, '4512726_on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onMoveToLevelWithOnOff: this._onMoveToLevelWithOnOff.bind(this),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(SrColorControlCluster.NAME,
        new ColorControlBoundCluster({
          onMoveToColorTemperature: this._onMoveToColorTemperature.bind(this),
          onMoveToHue: this._onMoveToHue.bind(this),
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

    if (type === '4512726_off') {

      this.homey.app.switchButtonOnOffTriggerCard.trigger(this, tokens,
        { 'mode': 'off' }).catch(this.error)

    } else if (type === '4512726_on') {

      this.homey.app.switchButtonOnOffTriggerCard.trigger(this, tokens,
        { 'mode': 'on' }).catch(this.error)
    }
  }

  _onMoveToHue ({ hue }, endpoint) {

    const homeyHue = SrUtils.getHomeyHue(hue)
    this.log(`_onMoveToHue hue ${hue}, homey hue ${homeyHue}, ${endpoint}`)

    const tokens = { 'hue': homeyHue }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512726_move_to_hue').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.hueMovedTriggerCard.trigger(this, tokens, state).catch(this.error)
  }

  _onMoveToColorTemperature ({ colorTemperature, transitionTime }, endpoint) {

    this.log(
      `_onMoveToColorTemperature ${colorTemperature} ${transitionTime}, ${endpoint}`)

    const whiteValue = SrUtils.getColorTemperatureToken(colorTemperature)
    const tokens = {
      'color_temperature': whiteValue,
      'transition_time': Math.floor(transitionTime / 10),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512726_move_to_color_temperature').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.whiteMovedTriggerCard.trigger(this, { 'white': whiteValue },
      state).catch(this.error)
  }

  _onMoveToLevelWithOnOff ({ level, transitionTime }, endpoint) {

    this.log(`_onMoveToLevel ${level} ${transitionTime}, ${endpoint}`)

    const brightness = SrUtils.getMoveToLevelToken(level)
    const tokens = {
      'level': brightness,
      'transition_time': Math.floor(transitionTime / 10),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512726_move_to_level_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.brightnessMovedTriggerCard.trigger(this,
      { 'brightness': brightness }, state).catch(this.error)
  }

}

module.exports = RemoteControl

/**

 SR-ZG2835

 1 Groups

 Input clusters:
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 Output clusters:
 Identify, On/Off, Level control, Ota, Color control
 [3, 5, 6, 8, 25, 768]

 */
