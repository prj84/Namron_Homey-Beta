'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')

module.exports = { 
  init(device){  
  },
  
  setConfig(device, payload){
  
    //console.log('regulator SET:', payload); 
 
    let num = payload.replace('min', '');
    num = num.trim(); 

    let payload2 = {} 
    
    //regulator set min
    payload2['regulator'] = num; 

    device.thermostatCluster().writeAttributes(payload2).catch(this.error)
    
  }, 
}  