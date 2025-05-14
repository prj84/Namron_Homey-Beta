'use strict'

const { CLUSTER, Cluster } = require('zigbee-clusters')
const { ZigBeeDevice } = require('homey-zigbeedriver')
const { getInt16 } = require('../../lib/SrUtils')

const SrBasic = require('../../lib/SrPlugThermostatBasicCluster')

Cluster.addCluster(SrBasic)

class MyDevice extends ZigBeeDevice {

  async onNodeInit ({ zclNode, node }) {

    this.enableDebug()

    this.registerCapability('onoff', CLUSTER.ON_OFF)

    this.meteringFactor = 1.0 / 3600000
    this.activePowerFactor = 0.1

    this.registerCapability('meter_power', CLUSTER.METERING)
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT)


    this.registerCapability('measure_temperature',
      CLUSTER.TEMPERATURE_MEASUREMENT, {
        get: 'measuredValue',
        report: 'measuredValue',
        reportParser: async value => {
          // MeasuredValue represents the temperature in degrees Celsius as follows:
          // MeasuredValue = 100 x temperature in degrees Celsius.
          return Math.round((value / 100) * 10) / 10
        },
      })

    this._listenTargetTemperatureReport()
    this._registerTargetTemperatureListener()
    this._setupSystemMode()
  }

  _setupSystemMode() {

    // Plug Mode

    this._basicCluster().readAttributes(['workingMode']).then(result => {

      this.log(`read working mode `, result, result['workingMode'])
      this.setCapabilityValue('plug_mode', result['workingMode']).catch(this.error)
    }).catch(this.error)

    this._basicCluster().on('attr.workingMode', value => {

      this.log(`attr.systemMode ${value}`)
      this.setCapabilityValue('plug_mode',
        value).catch(this.error)
    })

    this.registerCapabilityListener('plug_mode', async (value, opts) => {

      this.log(`set plug mode ${value}`)
      let payload = { workingMode: value }
      return this._basicCluster().writeAttributes(payload).catch(this.error)
    })

    // OnOff for System Mode

    this._onOffCluster().readAttributes(['onOff']).then(result => {

      this.log(`read onOff `, result, result['onOff'])
      let mode = 'off'
      if (result['onOff' === true]) {
        mode = 'heat'
      }

      let currentMode = this.getCapabilityValue('plug_thermostat_mode')
      // If current is off, and mode is not off, change it.
      if (currentMode === 'off') {
        if (mode !== currentMode) {
          this._thermostatCluster().writeAttributes({ systemMode: mode }).catch(this.error)
        }
      } else {
        // If current is not off but the new mode is off, change it.
        if (mode === 'off') {
          this._thermostatCluster().writeAttributes({ systemMode: mode }).catch(this.error)
        }
      }

    }).catch(this.error)

    this._onOffCluster().on('attr.onOff', value => {

      this.log(`attr.onOff `, value)
      this.setCapabilityValue('onoff',
        value).catch(this.error)

      let mode = 'off'
      if (value === true) {
        mode = 'heat'
      }
      this._thermostatCluster().writeAttributes({ systemMode: mode }).catch(this.error)
    })

    // System Mode

    this._thermostatCluster().readAttributes(['systemMode']).then(result => {

      this.log(`read systemmode result `, result, result['systemMode'])
      this.setCapabilityValue('plug_thermostat_mode',
        result['systemMode']).catch(this.error)

    }).catch(this.error)

    this._thermostatCluster().on('attr.systemMode', value => {

      this.log(`attr.systemMode ${value}`)
      this.setCapabilityValue('plug_thermostat_mode',
        value).catch(this.error)
    })

    this.registerCapabilityListener('plug_thermostat_mode', async (value, opts) => {

      this.log(`set system mode ${value}`)
      let payload = { systemMode: value }
      return this._thermostatCluster().writeAttributes(payload).catch(this.error)
    })
  }

  _listenTargetTemperatureReport () {

    this._thermostatCluster().on('attr.occupiedHeatingSetpoint', value => {

      this.log(`attr.occupiedHeatingSetpoint ${value}`)

      let temp = parseFloat((getInt16(value) / 100).toFixed(1))
      this.setCapabilityValue('target_temperature',
        temp).catch(this.error)
    })
  }

  _registerTargetTemperatureListener () {

    this.registerCapabilityListener('target_temperature',
      async (value, opts) => {

        let payload = { occupiedHeatingSetpoint: value * 100 }

        return this._thermostatCluster().
          writeAttributes(payload).
          catch(this.error)
      })
  }

  _thermostatCluster () {

    return this.zclNode.endpoints[2].clusters.thermostat
  }

  _basicCluster() {

    return this.zclNode.endpoints[1].clusters.basic
  }

  _onOffCluster() {

    return this.zclNode.endpoints[1].clusters.onOff
  }

}

module.exports = MyDevice
