'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')

module.exports = { 
  init(device){  
  },
  
  setConfig(device, payload){
  
    //device.log('+++backlight SET:', payload); 
   
    let payload2 = {}  

    payload2['backlight'] = parseFloat (payload)

    //device.log('++++ backlight SET', payload2)

    device.thermostatCluster().writeAttributes(payload2).catch(this.error)
    
  }, 
}  