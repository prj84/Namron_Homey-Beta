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

    if (!device.hasCapability('t7e_zg_sensor_mode')) return;
   
    //device.log('----------init t7e_zg_sensor_mode ...')

    device.setCapabilityValue('t7e_zg_sensor_mode', device.getStoreValue('sensor_mode') || 'a').catch(device.error)
    
    device.registerCapability('t7e_zg_sensor_mode', CLUSTER.THERMOSTAT, {
      get: 'sensorMode', report: 'sensorMode', reportParser: value => {
  
        let mode1 = device.getCapabilityValue('t7e_zg_sensor_mode'); 
        //let settings = device.getSettings();
        //let mode1 = settings.sensor_mode; 

        //device.log(`+++++++++ sensorMode report `, value, mode1)

        if (mode1 !== value){
          //device.setStoreValue('regulator_mode', value);
          //device.setStoreValue('regulator_mode_changed', true);
          //device.showMessage('The regulator mode has changed. Please go back and click `hzc_thermostat` to turn it on again.');
          
          //device.setUnavailable('The regulator mode has changed. Please go back and click `hzc_thermostat` to turn it on again.');
         
          //setTimeout( ()=> {
          //  device.setAvailable()
          //}, 3000)
        } 

        return value  

      }, getOpts: {
        getOnStart: true, 
        pollInterval: getOptBaseTime,  
        getOnOnline: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,  
          maxInterval: 300,  
          minChange: 1,
        },
      },
    })  

  },

  
  async setConfig(device, payload){
  
    console.log('sensor mode SET:', payload); 
 
    let payload2 = {} 
     
    payload2['sensorMode'] = payload;  
    
    try{
        device.thermostatCluster().writeAttributes(payload2)
    } catch(err){
        //device.log(err)
    } 
 

    let mode1 = device.getCapabilityValue('t7e_zg_sensor_mode'); 

    if (device.hasCapability('t7e_zg_sensor_mode')) {
      device.setCapabilityValue('t7e_zg_sensor_mode', payload).catch(this.error)
    } 
    
    if (mode1 !== payload && (mode1 === 'p' || payload === 'p')){ 

      device.setStoreValue('regulator_mode_changed', true);

      await device.showMessage(TIP_CHANGED);
       
   
    }

    

    
  }, 
}  