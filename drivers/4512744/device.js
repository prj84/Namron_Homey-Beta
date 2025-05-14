'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

const CapabilityToThermostatSetpointType = {
  'manual_mode': 'Heating 1',
  'auto_mode': 'Energy Save Heating',
  'dry_mode': 'Dry Air',
  'off_mode': 'Heating 1',
  'away_mode': 'Away Heating',
}

// ignore the off_mode, it doesn't need to set target temperature, always return null.
const SetpointTypeToCapabilityMode = {
  'Heating 1': 'manual_mode',
  'Energy Save Heating': 'auto_mode',
  'Dry Air': 'dry_mode',
  'Away Heating': 'away_mode',
}

const CapabilityToThermostatMode = {
  'manual_mode': 'Heat',
  'auto_mode': 'Energy Save Heat',
  'dry_mode': 'Dry Air',
  'off_mode': 'Off',
  'away_mode': 'AWAY',
}

const ThermostatModeToCapability = {
  'Heat': 'manual_mode',
  'Energy Save Heat': 'auto_mode',
  'Dry Air': 'dry_mode',
  'Off': 'off_mode',
  'AWAY': 'away_mode',
}

class MyThermostat extends ZwaveDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    if (this.hasCapability('onoff') === false) {
      await this.addCapability('onoff')
    }

    this._setUpOnOffCapability()
    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      reportParser: report => {
        return this._handleThermostatSetpointReport(report)
      }
    })
    // this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL')

    this.registerThermostatModeCapability()
    this.registerTemperatureControlReferenceSelectionCapability()

    this.registerTemperatureSensorCapability('my_ZV9092A_home_sensor', 1)
    this.registerTemperatureSensorCapability('my_ZV9092A_floor_sensor', 2)
  }

  registerThermostatModeCapability () {

    this.registerCapability('my_4512744_thermostat_mode', 'THERMOSTAT_MODE', {
      get: 'THERMOSTAT_MODE_GET',
      getOpts: {
        getOnStart: true,
      },
      set: 'THERMOSTAT_MODE_SET',
      setParser: value => {

        this.log('THERMOSTAT_MODE_SET ', value)
        if (!CapabilityToThermostatMode.hasOwnProperty(value)) {
          return null
        }
        const mode = CapabilityToThermostatMode[value]
        if (typeof mode !== 'string') {
          return null
        }

        if (CapabilityToThermostatSetpointType.hasOwnProperty(value)) {

          this.thermostatSetpointType = CapabilityToThermostatSetpointType[value]

          clearTimeout(this.refreshTargetTemperatureTimeout)
          this.refreshTargetTemperatureTimeout = this.homey.setTimeout(() => {

            this.log('Refresh Capability Value')
            this.refreshCapabilityValue('target_temperature',
              'THERMOSTAT_SETPOINT').catch(this.error)
          }, 1000)
        }

        return {
          'Level': {
            'No of Manufacturer Data fields': 0,
            'Mode': mode,
          },
          'Manufacturer Data': Buffer.from([]),
        }
      },
      report: 'THERMOSTAT_MODE_REPORT',
      reportParser: report => {

        this.log('CONFIGURATION_REPORT ', report)

        if (report
          && report.hasOwnProperty('Level')
          && report['Level'].hasOwnProperty('Mode')) {

          const mode = report['Level']['Mode']
          if (typeof mode === 'string' &&
            ThermostatModeToCapability.hasOwnProperty(mode)) {

            const capabilityMode = ThermostatModeToCapability[mode]
            this.log('Capability Mode ', capabilityMode)

            if (CapabilityToThermostatSetpointType.hasOwnProperty(
              capabilityMode)) {

              this.thermostatSetpointType = CapabilityToThermostatSetpointType[capabilityMode]

              clearTimeout(this.refreshTargetTemperatureTimeout)
              this.refreshTargetTemperatureTimeout = this.homey.setTimeout(
                () => {

                  this.log('Refresh Capability Value')
                  this.refreshCapabilityValue('target_temperature',
                    'THERMOSTAT_SETPOINT').catch(this.error)
                }, 1000)
            }

            let isOff = capabilityMode === 'off_mode'
            this.setCapabilityValue('onoff', !isOff).catch(this.error)

            return capabilityMode
          }
        }

        return null
      },
    })
  }

  setThermostatMode(value) {
    this.log('_setMode THERMOSTAT_MODE_SET ', value)
    if (!CapabilityToThermostatMode.hasOwnProperty(value)) {
      return null
    }
    const mode = CapabilityToThermostatMode[value]
    if (typeof mode !== 'string') {
      return null
    }

    if (CapabilityToThermostatSetpointType.hasOwnProperty(value)) {

      this.thermostatSetpointType = CapabilityToThermostatSetpointType[value]

      clearTimeout(this.refreshTargetTemperatureTimeout)
      this.refreshTargetTemperatureTimeout = this.homey.setTimeout(() => {

        this.log('Refresh Capability Value')
        this.refreshCapabilityValue('target_temperature',
          'THERMOSTAT_SETPOINT').catch(this.error)
      }, 1000)
    }

    const payload = {
      'Level': {
        'No of Manufacturer Data fields': 0,
        'Mode': mode,
      },
      'Manufacturer Data': Buffer.from([]),
    }

    this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_MODE.THERMOSTAT_MODE_SET(payload).then(() => {
      console.log(`_setMode ${value} OK`)
    }).catch(this.error)
  }

  registerTemperatureControlReferenceSelectionCapability () {

    this.registerCapability('my_ZV9092A_temperature_control_reference',
      'CONFIGURATION', {
        get: 'CONFIGURATION_GET',
        getOpts: {
          getOnStart: true,
        },
        getParser: (value) => {

          this.log('CONFIGURATION_GET ', value)

          return {
            'Parameter Number': 10,
          }
        },
        set: 'CONFIGURATION_SET',
        setParser: (value) => {

          this.log('CONFIGURATION_SET ', value)

          let selection = 1

          if (value === 'room_sensor') {

            selection = 1

          } else if (value === 'floor_sensor') {

            selection = 2

          } else if (value === 'room_floor_sensor') {

            selection = 3
          }

          this._updateCurrentTemperature(value)

          return {
            'Parameter Number': 10,
            'Level': {
              'Size': 1,
              'Default': false,
            },
            'Configuration Value': Buffer.from([selection]),
          }

        },
        report: 'CONFIGURATION_REPORT',
        reportParser: (value) => {

          this.log('CONFIGURATION_REPORT ', value)

          if (value
            && value.hasOwnProperty('Parameter Number')
            && value['Parameter Number'] === 10
            && value.hasOwnProperty('Configuration Value')) {

            const configurationValue = value['Configuration Value']
            if (typeof configurationValue === 'object' &&
              Buffer.isBuffer(configurationValue)) {

              const currentValue = configurationValue[0]
              this.log('configurationValue ', currentValue)

              if (currentValue === 1) {

                // this.setCapabilityValue('my_ZV9092A_temperature_control_reference', 'room_sensor').then()

                this._updateCurrentTemperature('room_sensor')
                return 'room_sensor'

              } else if (currentValue === 2) {

                // this.setCapabilityValue('my_ZV9092A_temperature_control_reference', 'floor_sensor').then()

                this._updateCurrentTemperature('floor_sensor')
                return 'floor_sensor'

              } else if (currentValue === 3) {

                // this.setCapabilityValue('my_ZV9092A_temperature_control_reference', 'room_floor_sensor').then()

                this._updateCurrentTemperature('room_floor_sensor')
                return 'room_floor_sensor'
              }
            }
          }
        },
      })
  }

  registerTemperatureSensorCapability (capabilityId, nodeId) {

    // my_ZV9092A_floor_sensor
    this.registerCapability(capabilityId, 'SENSOR_MULTILEVEL',
      {
        multiChannelNodeId: nodeId,
        get: 'SENSOR_MULTILEVEL_GET',
        getOpts: {
          getOnOnline: true,
          getOnStart: true,
        },
        getParser: () => ({
          'Sensor Type': 'Temperature (version 1)',
          Properties1: {
            Scale: 0,
          },
        }),
        report: 'SENSOR_MULTILEVEL_REPORT',
        reportParser: report => {
          if (
            report
            && report.hasOwnProperty('Sensor Type')
            && report['Sensor Type'] === 'Temperature (version 1)'
            && report.hasOwnProperty('Sensor Value (Parsed)')
            && report.hasOwnProperty('Level')
            && report.Level.hasOwnProperty('Scale')
          ) {
            // Some devices send this when no temperature sensor is connected
            if (report['Sensor Value (Parsed)'] === -999.9) {

              this._setCurrentTemperature(capabilityId, 0)
              return null
            }
            if (report.Level.Scale ===
              0) {
              let value = report['Sensor Value (Parsed)']
              this._setCurrentTemperature(capabilityId, value)
              return value
            }
            if (report.Level.Scale ===
              1) {
              let value = (report['Sensor Value (Parsed)'] - 32) / 1.8
              this._setCurrentTemperature(capabilityId, value)
              return value
            }
          }
          this._setCurrentTemperature(capabilityId, 0)
          return null
        },
      })
  }

  _setCurrentTemperature(capabilityId, value) {

    this.log(`setCurrentTemperature `, capabilityId, value)

    let controlType = this.getCapabilityValue('my_ZV9092A_temperature_control_reference')
    this.log(`controlType --- `, controlType)

    if (controlType === 'room_sensor') {

      if (capabilityId === 'my_ZV9092A_home_sensor') {
        this.setCapabilityValue('measure_temperature', value).catch(this.error)
      }

    } else if (controlType === 'floor_sensor') {

      if (capabilityId === 'my_ZV9092A_floor_sensor') {
        this.setCapabilityValue('measure_temperature', value).catch(this.error)
      }

    } else if (controlType === 'room_floor_sensor') {

      let roomValue = 0
      let floorValue = 0
      if (capabilityId === 'my_ZV9092A_home_sensor') {
        roomValue = value
      } else if (capabilityId === 'my_ZV9092A_floor_sensor') {
        floorValue = value
      }
      let maxValue = Math.max(roomValue, floorValue)
      this.setCapabilityValue('measure_temperature', maxValue).catch(this.error)
    }
  }

  _updateCurrentTemperature(controlType) {

    if (controlType === 'room_sensor') {

      let value = this.getCapabilityValue('my_ZV9092A_home_sensor')
      this.setCapabilityValue('measure_temperature', value).catch(this.error)

    } else if (controlType === 'floor_sensor') {

      let value = this.getCapabilityValue('my_ZV9092A_floor_sensor')
      this.setCapabilityValue('measure_temperature', value).catch(this.error)

    } else if (controlType === 'room_floor_sensor') {

      let homeValue = this.getCapabilityValue('my_ZV9092A_home_sensor')
      if (homeValue === null) homeValue = 0
      let floorValue = this.getCapabilityValue('my_ZV9092A_floor_sensor')
      if (floorValue === null) floorValue = 0

      let value = Math.max(homeValue, floorValue)
      this.setCapabilityValue('measure_temperature', value).catch(this.error)
    }

  }

  _setUpOnOffCapability() {

    this.setCapabilityValue('onoff', false).catch(this.error)

    this.registerCapabilityListener('onoff', isOn => {
      this.log(`onoff set `, isOn)

      let mode = isOn ? 'Heat' : 'Off'

      this.node.CommandClass.COMMAND_CLASS_THERMOSTAT_MODE.THERMOSTAT_MODE_SET({
        'Level': {
          'No of Manufacturer Data fields': 0,
          'Mode': mode,
        },
        'Manufacturer Data': Buffer.from([]),
      }).then(() => {
        this.log('onoff set mode OK ', isOn, mode)
      }).catch(this.error)
    })
  }

  _handleThermostatSetpointReport(report) {
    this.log('THERMOSTAT_SETPOINT report ')
    this.log(report)
    const setPointType = report['Level']['Setpoint Type']

    if (SetpointTypeToCapabilityMode.hasOwnProperty(setPointType)) {

      const tempMode = SetpointTypeToCapabilityMode[setPointType]
      const currentMode = this.getCapabilityValue('my_4512744_thermostat_mode')
      if (tempMode === currentMode) {
        const size = report['Level2']['Size']
        const precision = report['Level2']['Precision']
        const values = report['Value']
        const temperature = values.readIntBE(0, size)
        const result = temperature * Math.pow(10, -1 * precision)
        this.log(`result ${result}`)
        return result
      } else {
        this.log(`tempMode != currentMode`)
      }
    }
    // return default if it's not the same mode.
    this.log(`return current target temperature, it is not the same mode ${setPointType}`)
    return this.getCapabilityValue('target_temperature')
  }
}

module.exports = MyThermostat
