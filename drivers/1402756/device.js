'use strict'

const { ZwaveLightDevice } = require('homey-zwavedriver')

class DimLight extends ZwaveLightDevice {

  cur_meter_power = 0;
  
  async onNodeInit ({ node }) {

    // this.enableDebug()
    // this.printNode()
    
    if (this.hasCapability('measure_power')) {
      await this.removeCapability('measure_power') 
    }
    
    if (this.hasCapability('meter_power')){
      await this.removeCapability('meter_power')
    } 

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL')
    this.registerCapability('dim', 'SWITCH_MULTILEVEL') 

    this.registerReportListener('BASIC', 'BASIC_REPORT', report => {
      if (report && report.hasOwnProperty('Current Value')) {
        if (this.hasCapability('onoff')) this.setCapabilityValue('onoff',
          report['Current Value'] > 0)
        if (this.hasCapability('dim')) this.setCapabilityValue('dim',
          report['Current Value'] / 99)
      }
    }) 
    
  } 

}

module.exports = DimLight
