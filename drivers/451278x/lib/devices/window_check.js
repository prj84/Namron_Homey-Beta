'use strict'
module.exports = {
  setConfig(device, payload){

    //device.log('+++window check SET:', payload);

    let payload2 = {}

    payload2['windowCheck'] = payload;

    //device.log('++++ window check SET', payload2)

    device.thermostatCluster().writeAttributes(payload2).catch(device.error)

  },
}
