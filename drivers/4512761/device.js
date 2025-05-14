'use strict'

const { ZigBeeDevice } = require('homey-zigbeedriver')
const { CLUSTER } = require('zigbee-clusters')

class MyLight extends ZigBeeDevice {

  async onNodeInit ({ zclNode, node }) {
    super.onNodeInit({ zclNode, node })

    this.registerCapability('onoff', CLUSTER.ON_OFF)

    const {
      divisor,
    } = await this.zclNode.endpoints[this.getClusterEndpoint(
      CLUSTER.METERING)].clusters[CLUSTER.METERING.NAME].readAttributes(
      ['multiplier', 'divisor']).catch((error) => {
      this.log(error)
      return { divisor: 3600000 }
    })
    this.log('divisor ' + divisor)
    let safeDivisor = divisor
    if (typeof divisor !== 'number' || divisor <= 0) {
      safeDivisor = 3600000
    }
    this.registerCapability('meter_power', CLUSTER.METERING, {
      get: 'currentSummationDelivered',
      report: 'currentSummationDelivered',
      reportParser: value => value / safeDivisor,
    })

    const {
      acPowerMultiplier,
      acPowerDivisor,
    } = await this.zclNode.endpoints[this.getClusterEndpoint(
      CLUSTER.ELECTRICAL_MEASUREMENT)].clusters[CLUSTER.ELECTRICAL_MEASUREMENT.NAME].readAttributes(
      ['acPowerMultiplier', 'acPowerDivisor']).catch((error) => {
      this.log(error)
      return { acPowerMultiplier: null, acPowerDivisor: null }
    })
    // this.log('acPowerMultiplier ' + acPowerMultiplier + ", acPowerDivisor " + acPowerDivisor)
    let measureFactory = 0.1
    if (typeof acPowerMultiplier === 'number' && typeof acPowerDivisor ===
      'number' && acPowerMultiplier > 0 && acPowerDivisor > 0) {
      measureFactory = acPowerMultiplier / acPowerDivisor
    }
    this.log(`measureFactory ${measureFactory}`)
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
      get: 'activePower',
      report: 'activePower',
      reportParser: value => value * measureFactory,
      getParser: value => value * measureFactory,
      getOpts: {
        getOnStart: true,
        pollInterval: 60 * 60 * 1000,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 5, // Minimally once every 5 seconds
          maxInterval: 60000, // Maximally once every ~16 hours
          minChange: 2 / measureFactory,
        },
      },
    })
  }

}

module.exports = MyLight
