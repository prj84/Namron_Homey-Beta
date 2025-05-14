'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')

module.exports = {

  async setConfig(device, payload){

    device.log('+++ run mode SET:', payload);

    if (payload === 'eco') {
        await device.thermostatCluster().writeAttributes({vacation_mode: false})
        await device.setSettings({vacation_mode: 'false'})
        await device.thermostatCluster().setEco({ecoMode: true})
        if (device.hasCapability('eco_mode')) {
            await device.setCapabilityValue('eco_mode', true)
        }
        return
    }
    let payloads = { runMode: payload === 'program' }

    //device.log('.......payload = ', payloads)
      if (device.hasCapability('eco_mode')) {
          if (device.hasCapability('eco_mode')) {
            await device.setCapabilityValue('eco_mode', false)
          }
          await device.thermostatCluster().setEco({ecoMode: false})
      }
      await device.thermostatCluster().writeAttributes({vacation_mode: false})
      await device.setSettings({vacation_mode: 'false'})
    await device.thermostatCluster().setProgram(payloads).catch(this.error)

  },
}
