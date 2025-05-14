'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

const { CLUSTER, BoundCluster } = require('zigbee-clusters');

class TempHumSensor_4512765 extends ZigBeeDevice {

    onNodeInit({ zclNode }) {

        //this.enableDebug;
        //this.printNode;

        if (this.hasCapability('alarm_battery')) {

            this.batteryThreshold = 20;
            this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
                getOpts: {
                    getOnStart: true,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 0, 
                        maxInterval: 60000,  
                        minChange: 5,  
                    },
                },
            });
        }

        if (this.hasCapability('measure_battery')) {
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
                getOpts: {
                    getOnStart: true,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 0,
                        maxInterval: 60000,
                        minChange: 1,
                    },
                },
            });
        }
 
        if (this.hasCapability('measure_temperature')) { 
            this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT, {
                getOpts: {
                    getOnStart: true,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 0,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
            })
        }

        this.zclNode.endpoints[1].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME].on('attr.measuredValue',
            this.onTemperatureReport.bind(this)
        ); 
  
        if (this.hasCapability('measure_humidity')) { 
            this.registerCapability('measure_humidity', CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT, {
                getOpts: {
                    getOnStart: true,
                },
                reportOpts: {
                    configureAttributeReporting: {
                        minInterval: 0,
                        maxInterval: 300,
                        minChange: 1,
                    },
                },
            })
        }

        this.zclNode.endpoints[1].clusters[CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT.NAME].on('attr.measuredValue',
            this.onHumidityReport.bind(this)
        );

        this.read_params() 

        //check device connect....
        this._start_check_device()

    }



    async read_params() {
        try {
            await this.zclNode.endpoints[1].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME].readAttributes(['measuredValue']).then(value => {
                this.log(`+++++++ measuredValue = `, value)
                if (value.hasOwnProperty('measuredValue')) {
                    this.onTemperatureReport(value['measuredValue'])
                }
            })
        }
        catch (error) {
            this.tipinfo = "" + error
            this.inited = false
        }

        try {
            await this.zclNode.endpoints[1].clusters[CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT.NAME].readAttributes(['measuredValue']).then(value => {
                this.log(`+++++++ measuredValue = `, value)
                if (value.hasOwnProperty('measuredValue')) {
                    this.onHumidityReport(value['measuredValue'])
                }
            })
        } catch (error) {
            this.tipinfo = "" + error
            this.inited = false
        }


        try {
            await this.zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].readAttributes(['batteryPercentageRemaining']).then(value => {
                this.log(`+++++++ POWER_CONFIGURATION = `, value)
                if (value.hasOwnProperty('batteryPercentageRemaining')) {

                }
            })
        } catch (error) {
            this.tipinfo = "" + error
            this.inited = false
        }
    }

 
    onTemperatureReport(value) {
        const parsedValue = this.getSetting('temperature_decimals') === '2' ? Math.round((value / 100) * 100) / 100 : Math.round((value / 100) * 10) / 10;
        if (parsedValue !== -100) {
            const temperatureOffset = this.getSetting('temperature_offset') || 0;
            this.log('temperature:', parsedValue, ', offset', temperatureOffset);
            this.setCapabilityValue('measure_temperature', parsedValue + temperatureOffset);

            this.setStoreValue('last_online', new Date().getTime());
        }
    }
 
    onHumidityReport(value) {
        const humidityOffset = this.getSetting('humidity_offset') || 0;
        const parsedValue = this.getSetting('humidity_decimals') === '2' ? Math.round((value / 100) * 100) / 100 : Math.round((value / 100) * 10) / 10;
        this.log('==========>humidity:', parsedValue, ', offset', humidityOffset);
        this.setCapabilityValue('measure_humidity', parsedValue + humidityOffset);

        this.setStoreValue('last_online', new Date().getTime());
    }






    //======================================================================
    //======================================================================
    //======================================================================
    _start_check_device() {
        let onlineLast = this.getStoreValue('last_online') || 0
        if (onlineLast === 0) {
            this.setStoreValue('last_online', new Date().getTime());
        }
        this._check_device_connected()
    }

    async _check_device_connected() {

        await this.unsetWarning();

        let onlineLast = this.getStoreValue('last_online') || 0 
        if (onlineLast > 0) {
            let t1 = new Date().getTime()
            let dx = t1 - onlineLast

            let spantime = 2 * 60 * 60 * 1000 + 30 * 1000 
            if (dx >= spantime) {
                this.tipinfo = "Error: Device is not responding, make sure the device has power."
                this.log('xxxxxxxxxx init :', this.tipinfo)
                await this.setWarning("Error: Device is not responding, make sure the device has power.");
            }
        }

        this.homey.setTimeout(() => {
            this._check_device_connected()
        }, 20000)
    }

}

module.exports = TempHumSensor_4512765;