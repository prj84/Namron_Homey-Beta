'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')

const { CLUSTER, Cluster } = require('zigbee-clusters')
const OccupancySensing = require('../../lib/SrOccupancySensing')

Cluster.addCluster(OccupancySensing)

/*
    1030, 0x0406, Occupancy Sensing, endpoint 1
    1280, 0x0500, IAS Zone, endpoint 2
    1026, 0x0402, Temperature Sensor, endpoint 3
    1029, 0x0405, Humidity, endpoint 4
    1024, 0x0400, Illuminance, endpoint 5
 */
class Sensor_4512771 extends ZigBeeDevice {

    onNodeInit({ zclNode }) {

        // this.enableDebug()
        // this.printNode()

        if (this.hasCapability('alarm_battery')) {
            this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION)
        }

        if (this.hasCapability('measure_battery')) {
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION)
        }

        if (this.hasCapability('alarm_motion')) {
            this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING, {
                get: 'occupancy',
                report: 'occupancy',
                reportParser(value) {
                    const newValue = value['occupied']
                    if (typeof newValue === 'boolean') {
                        return newValue
                    }
                    return false
                },
            })
        }

        if (this.hasCapability('measure_temperature')) {
            this.registerCapability('measure_temperature',
                CLUSTER.TEMPERATURE_MEASUREMENT)
        }

        if (this.hasCapability('measure_humidity')) {
            this.registerCapability('measure_humidity',
                CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT)
        }

        if (this.hasCapability('measure_luminance')) {
            this.registerCapability('measure_luminance',
                CLUSTER.ILLUMINANCE_MEASUREMENT)
        }

        this.occupancySensingCluster = this.zclNode.endpoints[1].clusters.occupancySensing
        this._syncSensitivity().catch(this.error)
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {

        if (newSettings.hasOwnProperty('sensitivity')) {
            let newValue = newSettings['sensitivity']
            if (typeof newValue === 'string') {
                this.log(`will set sensitivity`)
                // 0: disable PIR.
                // 8-255: enable PIR, 8 means the highest sensitivity, 255 means the lowest sensitivity.
                // Default value is 15.

                // Occupancy Sensing - 0x0406 (Server)
                // Endpoint 1, Cluster 1030
                // Attribute: 0x1000
                // Type: ENUM8, reportable
                // ManufacturerCode: 0x1224

                const payload = {
                    sensitivity: newValue,
                }
                this.log(`will set sensitivity ${newValue}`)
                // const occupancySensingCluster = this.zclNode.endpoints[1].clusters.occupancySensing
                // occupancySensingCluster.readAttributes(['sensitivity']).then(async (result) => {
                //   this.log(`sensitivity read ${result['sensitivity']}`)
                // }).catch(this.error)
                await this.occupancySensingCluster.writeAttributes(payload).then(() => {
                    this.log(`already set sensitivity ${payload.sensitivity}`)
                    return "Successful"
                }).catch(error => {
                    this.log(`set error ${error}`)
                    // return 'Failed to set, active the device before saving.'
                    throw new Error(`${error}`)
                })
            } else {
                throw new Error('Failed to set, unknown value.')
            }
        } else {
            this.log(`won't set sensitivity`)
            return super.onSettings({ oldSettings, newSettings, changedKeys })
        }
    }

    async _syncSensitivity() {
        return this.occupancySensingCluster.readAttributes(['sensitivity']).then(async (result) => {
            const value = result['sensitivity']
            this.log(`sensitivity read ${value} ${typeof value}`)
            if (typeof value === 'string') {
                await this.setSettings({
                  'sensitivity': value
                })
            }
        }).catch(this.error)
    }

}

module.exports = Sensor_4512771

