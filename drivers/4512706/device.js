'use strict'

const { CLUSTER, Cluster } = require('zigbee-clusters')

const SrSceneCluster = require('../../lib/SrSceneCluster')
const SrSceneBoundCluster = require('../../lib/SrSceneBoundCluster')

const SrColorControlCluster = require('../../lib/SrColorControlCluster')

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster')
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster')
const ColorControlBoundCluster = require('../../lib/ColorControlBoundCluster')

const ZigBeeRemoteControl = require('../../lib/ZigBeeRemoteControl')

const SrUtils = require('../../lib/SrUtils')

Cluster.addCluster(SrSceneCluster)
Cluster.addCluster(SrColorControlCluster)

class RemoteControl extends ZigBeeRemoteControl {

  async onNodeInit ({ zclNode, node }) {
    await super.onNodeInit({ zclNode, node })

    // <triggerId, timer>
    this.triggerRepeatTimers = {}
    // <triggerId, true or false>
    this.triggerRepeats = {}

    // Flows

    Object.keys(this.zclNode.endpoints).forEach((endpoint) => {

      this.zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME,
        new OnOffBoundCluster({
          onSetOff: this._onOffCommandHandler.bind(this, '4512706_off'),
          onSetOn: this._onOffCommandHandler.bind(this, '4512706_on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onStepWithOnOff: this._onLevelStepWithOnOff.bind(this),
          onStep: this._onLevelStepWithOnOff.bind(this),
          onStopWithOnOff: this._onLevelStopWithOnOff.bind(this),
          onMoveWithOnOff: this._onLevelMoveWithOnOff.bind(this),
          onStop: this._onLevelStopWithOnOff.bind(this),
          onMove: this._onLevelMoveWithOnOff.bind(this),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(SrColorControlCluster.NAME,
        new ColorControlBoundCluster({
          onMoveToColorTemperature: this._onMoveToColorTemperature.bind(this),
          onMoveToHue: this._onMoveToHue.bind(this),
          onMoveToHueAndSaturation: this._onMoveToHue.bind(this),
          onMoveToSaturation: this._onMoveToSaturation.bind(this),
          onMoveSaturation: this._onMoveSaturation.bind(this),
          onStopMoveStep: this._onStopMoveStep.bind(this),
          onMoveColorTemperature: this._onMoveColorTemperature.bind(this),
          onStepColorTemperature: this._onStepColorTemperature.bind(this),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(SrSceneCluster.NAME,
        new SrSceneBoundCluster({
          onSrStoreScene: this._onStoreScene.bind(this),
          onSrRecallScene: this._onRecallScene.bind(this),
          endpoint: endpoint,
        }))

    })
  }

  _onOffCommandHandler (type, endpoint) {
    const triggerId = '_onOffCommandHandler'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onOffCommandHandler => ${type}, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard(type).
      trigger(this, tokens, state).
      catch(this.error)

    if (type === '4512706_off') {

      this.homey.app.switchButtonOnOffG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'off' }).
        catch(this.error)

    } else if (type === '4512706_on') {

      this.homey.app.switchButtonOnOffG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'on' }).
        catch(this.error)
    }
  }

  _onMoveToHue ({ hue }, endpoint) {
    const triggerId = '_onMoveToHue'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    const homeyHue = SrUtils.getHomeyHue(hue)
    this.log(`_onMoveToHue hue ${hue}, homey hue ${homeyHue}, ${endpoint}`)

    const tokens = { 'hue': homeyHue }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_move_to_hue').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.hueMovedG4TriggerCard.trigger(this, tokens, state).
      catch(this.error)
  }

  _onMoveToSaturation ({ saturation }, endpoint) {
    const triggerId = '_onMoveToSaturation'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    const homeySaturation = SrUtils.getHomeySaturation(saturation)
    this.log(
      `_onMoveToSaturation ${saturation}, ${homeySaturation}, ${endpoint}`)

    const tokens = { 'saturation': homeySaturation }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_move_to_saturation').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.saturationButtonModeG4TriggerCard.
      trigger(this, tokens, { 'group': endpoint, 'mode': 'pressed' }).
      catch(this.error)
  }

  _onMoveSaturation ({ moveMode, rate }, endpoint) {
    const triggerId = '_onMoveSaturation'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(`_onMoveSaturation ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveSaturationMoveModeToken(moveMode),
      'rate': SrUtils.getMoveSaturationRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_move_saturation').
      trigger(this, tokens, state).catch(this.error)

    if (moveMode === 'up') {

      this.homey.app.saturationButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'up' }).
        catch(this.error)

    } else if (moveMode === 'down') {

      this.homey.app.saturationButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'down' }).
        catch(this.error)

    } else if (moveMode === 'stop') {

      this.homey.app.saturationButtonModeG4TriggerCard.
        trigger(this, tokens, { 'group': endpoint, 'mode': 'stop' }).
        catch(this.error)
    }
  }

  _onRecallScene ({ groupId, sceneId }, endpoint) {
    const triggerId = '_onRecallScene'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(`_onRecallScene ${groupId} ${sceneId}, ${endpoint}`)

    const tokens = {
      'group_id': groupId,
      'scene_id': sceneId,
    }
    const state = { 'group': endpoint, 'scene': sceneId.toString() }
    this.driver.getDeviceTriggerCard('4512706_recall_scene').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.sceneButtonModeG4S7TriggerCard.
      trigger(this, tokens,
        { 'group': endpoint, 'scene': sceneId.toString(), 'mode': 'pressed' }).
      catch(this.error)
  }

  _onStoreScene ({ groupId, sceneId }, endpoint) {
    const triggerId = '_onStoreScene'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(`_onStoreScene ${groupId} ${sceneId}, ${endpoint}`)

    const tokens = {
      'group_id': groupId,
      'scene_id': sceneId,
    }
    const state = { 'group': endpoint, 'scene': sceneId.toString() }
    this.driver.getDeviceTriggerCard('4512706_store_scene').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.sceneButtonModeG4S7TriggerCard.
      trigger(this, tokens,
        {
          'group': endpoint,
          'scene': sceneId.toString(),
          'mode': 'held_down',
        }).catch(this.error)
  }

  _onLevelStepWithOnOff ({ mode, stepSize, transitionTime }, endpoint) {
    const triggerId = '_onLevelStepWithOnOff'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    const tokens = {
      'mode': SrUtils.getStepLevelModeToken(mode),
      'step_size': SrUtils.getStepLevelStepSizeToken(stepSize),
      'transition_time': Math.floor(transitionTime / 10),
    }
    this.log(
      `_onLevelStepWithOnOff ${mode} ${stepSize} ${transitionTime}, ${endpoint}`)
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_level_step_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    if (mode === 'up') {

      this.homey.app.brightnessButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'up', 'mode': 'pressed' },
        ).catch(this.error)

    } else if (mode === 'down') {

      this.homey.app.brightnessButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'down', 'mode': 'pressed' },
        ).catch(this.error)
    }
  }

  _onLevelMoveWithOnOff ({ moveMode, rate }, endpoint) {
    const triggerId = '_onLevelMoveWithOnOff'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onLevelMoveWithOnOff ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveLevelMoveModeToken(moveMode),
      'rate': SrUtils.getMoveLevelRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_level_move_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.brightnessMoveMode = moveMode
    if (moveMode === 'up') {

      this.homey.app.brightnessButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'up', 'mode': 'held_down' },
        ).catch(this.error)

    } else if (moveMode === 'down') {

      this.homey.app.brightnessButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'down', 'mode': 'held_down' },
        ).catch(this.error)
    }
  }

  _onLevelStopWithOnOff (endpoint) {
    const triggerId = '_onLevelStopWithOnOff'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onLevelStopWithOnOff, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_level_stop_with_onoff').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.brightnessButtonTypeModeG4TriggerCard.
      trigger(this, tokens,
        {
          'group': endpoint,
          'type': this.brightnessMoveMode,
          'mode': 'released',
        },
      ).catch(this.error)
  }

  _onStepColorTemperature (
    {
      stepMode,
      stepSize,
      transitionTime,
      colorTemperatureMinimumMireds,
      colorTemperatureMaximumMireds,
    },
    endpoint) {
    const triggerId = '_onStepColorTemperature'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onStepColorTemperature ${stepMode} ${stepSize} ${transitionTime} ${colorTemperatureMinimumMireds} ${colorTemperatureMaximumMireds}, ${endpoint}`)

    const tokens = {
      'step_mode': SrUtils.getStepColorTemperatureStepModeToken(stepMode),
      'step_size': SrUtils.getStepColorTemperatureStepSizeToken(stepSize),
      'transition_time': Math.floor(transitionTime / 10),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_step_color_temperature').
      trigger(this, tokens, state).catch(this.error)

    if (stepMode === 'up') {

      this.homey.app.whiteButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'warmer', 'mode': 'pressed' }).
        catch(this.error)

    } else if (stepMode === 'down') {

      this.homey.app.whiteButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'cooler', 'mode': 'pressed' }).
        catch(this.error)
    }
  }

  _onMoveToColorTemperature ({ colorTemperature, transitionTime }, endpoint) {
    const triggerId = '_onMoveToColorTemperature'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onMoveToColorTemperature ${colorTemperature} ${transitionTime}, ${endpoint}`)

    const whiteValue = SrUtils.getColorTemperatureToken(colorTemperature)

    const tokens = {
      'color_temperature': whiteValue,
      'transition_time': Math.floor(transitionTime / 10),
      'white': whiteValue,
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_move_to_color_temperature').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.whiteMovedG4TriggerCard.trigger(this, tokens, state).
      catch(this.error)
  }

  _onMoveColorTemperature (
    {
      moveMode,
      rate,
      colorTemperatureMinimumMireds,
      colorTemperatureMaximumMireds,
    },
    endpoint) {
    const triggerId = '_onMoveColorTemperature'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onMoveColorTemperature ${moveMode} ${rate} ${colorTemperatureMinimumMireds} ${colorTemperatureMaximumMireds}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveColorTemperatureMoveModeToken(moveMode),
      'rate': SrUtils.getMoveColorTemperatureRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_move_color_temperature').
      trigger(this, tokens, state).catch(this.error)

    if (moveMode === 'up') {

      this.whiteMoveMode = 'warmer'
      this.homey.app.whiteButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'warmer', 'mode': 'held_down' }).
        catch(this.error)

    } else if (moveMode === 'down') {

      this.whiteMoveMode = 'cooler'
      this.homey.app.whiteButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          { 'group': endpoint, 'type': 'cooler', 'mode': 'held_down' }).
        catch(this.error)

    } else if (moveMode === 'stop') {

      this.homey.app.whiteButtonTypeModeG4TriggerCard.
        trigger(this, tokens,
          {
            'group': endpoint,
            'type': this.whiteMoveMode,
            'mode': 'released',
          }).catch(this.error)
    }
  }

  _onStopMoveStep (endpoint) {
    const triggerId = '_onStopMoveStep'
    if (this._isRepeat(triggerId)) {
      this.log(`is repeat ${triggerId}`)
      return
    }
    this._setupRepeatTimer(triggerId)

    this.log(
      `_onStopMoveStep, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('4512706_stop_move_step').
      trigger(this, tokens, state).catch(this.error)

    this.homey.app.whiteButtonTypeModeG4TriggerCard.
      trigger(this, tokens,
        { 'group': endpoint, 'type': this.whiteMoveMode, 'mode': 'released' }).
      catch(this.error)
  }

  _setupRepeatTimer (triggerId) {
    if (this.triggerRepeatTimers[triggerId]) {
      clearTimeout(this.triggerRepeatTimers[triggerId])
      this.log(`clear timeout ${triggerId}`)
    }
    this.triggerRepeats[triggerId] = true
    this.log(`set timeout true ${triggerId}`)
    this.triggerRepeatTimers[triggerId] = setTimeout(() => {
      this.triggerRepeats[triggerId] = false
      this.log(`set timeout false ${triggerId}`)
    }, 20)
  }

  _isRepeat (triggerId) {
    if (this.triggerRepeats[triggerId]) {
      return this.triggerRepeats[triggerId]
    }
    return false
  }

}

module.exports = RemoteControl

/**

 4 Groups

 Input clusters:
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 Output clusters:
 Identify, Groups, Scene, On/Off, Level control, Ota, Color control
 [3, 4, 5, 6, 8, 25, 768]

 */
