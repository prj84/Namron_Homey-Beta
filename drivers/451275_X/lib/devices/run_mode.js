'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')

module.exports = {  
  
  setConfig(device, payload){
  
    //device.log('+++ run mode SET:', payload);  

    let payloads = { runMode: payload === 'program' }

    //device.log('.......payload = ', payloads)
    device.thermostatCluster().setProgram(payloads).catch(this.error)
    
  },  
}  