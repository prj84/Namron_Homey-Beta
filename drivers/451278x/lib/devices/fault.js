'use strict'
const {CLUSTER} = require('zigbee-clusters')
const {
    getOptBaseTime, TIP_CHANGED
} = require('./utils');
const {set_fault_sensor} = require("./set_fault_sensor");
module.exports = {
    init(device) {
        this.registerCapability(device)
    },
    registerCapability(device) {
       // device.homey.clearInterval(device.fault_timer)
       // device.fault_timer = device.homey.setInterval(() => {
       //     device.thermostatCluster().readAttributes(["fault"]).then(value => {
       //         if (value.hasOwnProperty('fault')) {
       //             const faultValue = value['fault']
       //             set_fault_sensor(device, faultValue)
       //         }
       //     }).catch(device.error)
       // }, 3000)
       //  if (!device.hasCapability('t11_zg_fault')) return;
       //
       //  device.registerCapability('t11_zg_fault', CLUSTER.THERMOSTAT, {
       //      get: 'fault', report: 'fault', reportParser: value => {
       //          device.log('+++++++++++ fault report: ', value)
       //          let thefault = '0'
       //          const res = value.getBits();
       //          if (res.length > 0) {
       //              thefault = res[res.length - 1];
       //              device.log('@@@@ falut = ', res, thefault, res.length)
       //              if (thefault === undefined) {
       //                  thefault = '0'
       //              }
       //          }
       //          return thefault
       //      }, getOpts: {
       //          getOnStart: true,
       //          pollInterval: getOptBaseTime,
       //          getOnOnline: true,
       //      },
       //      reportOpts: {
       //          configureAttributeReporting: {
       //              minInterval: 0,
       //              maxInterval: 300,
       //              minChange: 0.01,
       //          },
       //      },
       //  })

    },
}
