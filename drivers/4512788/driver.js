'use strict';

const { Driver } = require('homey');

class DimmerDriver extends Driver {
   
    async onInit() {
        this.log('DimmerDriver has been initialized');
    }
 
}

module.exports = DimmerDriver;