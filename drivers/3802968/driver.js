'use strict'

const SrZigBeeDriver = require('../../lib/SrZigBeeDriver')

class MyDriver extends SrZigBeeDriver {

  onInit () {
    super.onInit()

    this._levelStepActionCard = this.getActionCard('3802968_level_step_with_onoff')
    this._levelStepActionCard.registerRunListener((args, state) => {
      return args.device.levelStepRunListener(args, state).catch(this.error)
    })

    this._levelMoveActionCard = this.getActionCard('3802968_level_move_with_onoff')
    this._levelMoveActionCard.registerRunListener((args, state) => {
      return args.device.levelMoveRunListener(args, state).catch(this.error)
    })

    this._levelStopActionCard = this.getActionCard('3802968_level_stop_with_onoff')
    this._levelStopActionCard.registerRunListener((args, state) => {
      return args.device.levelStopRunListener(args, state).catch(this.error)
    })

    this._stepColorTemperatureActionCard = this.getActionCard(
      '3802968_step_color_temperature')
    this._stepColorTemperatureActionCard.registerRunListener((args, state) => {
      return args.device.stepColorTemperatureRunListener(args, state).catch(this.error)
    })

    this._moveColorTemperatureActionCard = this.getActionCard(
      '3802968_move_color_temperature')
    this._moveColorTemperatureActionCard.registerRunListener((args, state) => {
      return args.device.moveColorTemperatureRunListener(args, state).catch(this.error)
    })

    this._stopMoveStepActionCard = this.getActionCard(
      '3802968_stop_move_step')
    this._stopMoveStepActionCard.registerRunListener((args, state) => {
      return args.device.stopMoveStepRunListener(args, state).catch(this.error)
    })

    this._recallSceneActionCard = this.getActionCard('3802968_recall_scene')
    this._recallSceneActionCard.registerRunListener((args, state) => {
      return args.device.recallSceneRunListener(args, state).catch(this.error)
    })

    this._storeSceneActionCard = this.getActionCard('3802968_store_scene')
    this._storeSceneActionCard.registerRunListener((args, state) => {
      return args.device.storeSceneRunListener(args, state).catch(this.error)
    })
  }

}

module.exports = MyDriver
