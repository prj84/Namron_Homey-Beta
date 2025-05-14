'use strict'
const { CLUSTER, Cluster } = require('zigbee-clusters')
const { 
  getOptBaseTime, TIP_CHANGED
}                               = require('./utils');
module.exports = { 
  init(device){  
    this.registerCapability(device)
  }, 
  registerCapability(device){ 

    if (!device.hasCapability('t7e_zg_fault')) return;

    //device.log('----------init t7e_zg_fault ...')

    



    return;
   
    
    
    device.registerCapability('t7e_zg_fault', CLUSTER.THERMOSTAT, {
      get: 'fault', report: 'fault', reportParser: value => { 
        //device.log('+++++++++++ fault report: ', value)
        let thefault = '0'
        const res = value.getBits();
        if (res.length > 0){   
            thefault = res[res.length - 1];
            //device.log('@@@@ falut = ', res, thefault, res.length)
            if (thefault === undefined){
              thefault = '0'
            } 
        } 
        return thefault 
      }, getOpts: {
        getOnStart: true, 
        pollInterval: getOptBaseTime,  
        getOnOnline: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,  
          maxInterval: 300,  
          minChange: 0.01,
        },
      },
    })  

  }, 
}  