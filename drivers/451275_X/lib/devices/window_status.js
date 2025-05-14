'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { 
    getOptBaseTime
  }                               = require('./utils');
module.exports = {  
    init(device){
        this.registerCapability(device)
    },
    registerCapability(device) {

        if (!device.hasCapability('t7e_zg_window_state')) return 
    
        device.registerCapability('t7e_zg_window_state', CLUSTER.THERMOSTAT, {
          get: 'windowState', report: 'windowState', reportParser: value => {
    
            //device.log(`windowState report `, value, value === 'opened')
            return value ? 'opened' : "closed"
          }, 
          getOpts: {
            getOnStart: true, pollInterval: getOptBaseTime,  
            getOnOnline: true,
          },
          reportOpts: {
            configureAttributeReporting: {
              minInterval: 10,  
              maxInterval: 600, 
              minChange: 1,
            },
          },
        })
      } 
   
}  

