'use strict';

const { Driver } = require('homey');

class DimmerPowerDriver extends Driver {
 
  async onInit() {
    this.log('DimmerPowerDriver has been initialized');
  }
  
}

module.exports = DimmerPowerDriver;