'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

const DeviceOperatingMode = {
  0: 'switch_mode',
  1: 'thermostat_mode',
}
const DeviceOperatingModeValue = {
  'switch_mode': 0,
  'thermostat_mode': 1,
}

class MyOutlet extends ZwaveDevice {

  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()

    this.registerCapability('onoff', 'SWITCH_BINARY')

    this.registerCapability('measure_power', 'METER')
    this.registerCapability('meter_power', 'METER')

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT')
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL')

    this.registerMyDeviceOperatingMode()
  }

  registerMyDeviceOperatingMode () {

    this.registerCapability('my_device_operating_mode', 'CONFIGURATION', {
      get: 'CONFIGURATION_GET',
      getOpts: {
        getOnStart: true,
      },
      getParser () {
        return {
          'Parameter Number': 7,
        }
      },
      set: 'CONFIGURATION_SET',
      setParser: (value) => {

        this.log('CONFIGURATION_SET ', value)

        const mode = DeviceOperatingModeValue[value]
        if (typeof mode !== 'number') {
          this.log('mode !== number ', typeof mode)
          return null
        }

        this.updateDeviceClass(value)

        return {
          'Parameter Number': 7,
          'Level': {
            'Default': false,
            'Size': 1,
          },
          'Configuration Value': Buffer.from([mode]),
        }
      },
      report: 'CONFIGURATION_REPORT',
      reportParser: report => {

        this.log('CONFIGURATION_REPORT ', report)

        if (report
          && report.hasOwnProperty('Parameter Number')
          && report['Parameter Number'] === 7
          && report.hasOwnProperty('Configuration Value')) {

          const value = report['Configuration Value']
          this.log('configuration get: ', value.toString('hex'))

          const mode = DeviceOperatingMode[value[0]]
          if (typeof mode === 'string') {

            this.updateDeviceClass(mode)
            return mode
          }
        }

        return null

        if (
          report
          && report.hasOwnProperty('Level2')
          && report.Level2.hasOwnProperty('Scale')
          && report.Level2.hasOwnProperty('Precision')
          && report.Level2.Scale === 0
          && typeof report.Level2.Size !== 'undefined'
        ) {
          let readValue
          try {
            readValue = report.Value.readUIntBE(0, report.Level2.Size)
          } catch (err) {
            return null
          }

          if (typeof readValue !== 'undefined') {
            return readValue / (10 ** report.Level2.Precision)
          }
          return null
        }
        return null
      },
    })
  }

  updateDeviceClass (device_operating_mode) {

    if (device_operating_mode === 'thermostat_mode') {

      if (this.getClass() !== 'thermostat') {

        this.setClass('thermostat').catch(this.error)
      }

    } else {

      if (this.getClass() !== 'socket') {

        this.setClass('socket').catch(this.error)
      }
    }
  }

}

module.exports = MyOutlet
