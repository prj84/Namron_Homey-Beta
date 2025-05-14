'use strict'
const { CLUSTER } = require('zigbee-clusters');
const {
    wrapAsyncWithRetry,
    wait,
} = require('homey-zigbeedriver/lib/util');
const HzcZigBeeLightDevice = require("../../lib/HzcZigBeeLightDevice");
const MAX_DIM = 254;
const CURRENT_LEVEL = 'currentLevel';

class D1402769_LightDevice extends HzcZigBeeLightDevice {

    async onNodeInit({ zclNode }) {

        if (!this.hasCapability('onoff')) {
            await this.addCapability('onoff');
        }
        if (!this.hasCapability('dim')) {
            await this.addCapability('dim');
        }

        // Error: UNSUP_CLUSTER_COMMAND
        //await super.onNodeInit({ zclNode, supportsHueAndSaturation: false, supportsColorTemperature: false }); 

        //Error: UNSUP_CLUSTER_COMMAND  in internal
        this._onNodeInit2()
    }


    async changeOnOff(onoff) {
        this.log('changeOnOff() →', onoff);

        this.log('---', new Date())

        try {
            await this.onOffCluster[onoff ? 'setOn' : 'setOff']()
            this.log('---1', new Date())
        } catch (error) {
            //this.log('-------changeOnOff : ', error)
            this.log('---2', new Date())
        }

        this.log('---3', new Date())
        if (onoff === false) {
            await this.setCapabilityValue('dim', 0); // Set dim to zero when turned off
        } else if (onoff) {
            // Wait for a little while, some devices do not directly update their currentLevel
            await wait(1000)
                .then(async () => {
                    this.log('---4', new Date())
                    // Get current level attribute to update dim level
                    const { currentLevel } = await this.levelControlCluster.readAttributes([CURRENT_LEVEL]);
                    this.debug('changeOnOff() →', onoff, { currentLevel });
                    // Always set dim to 0.01 or higher since bulb is turned on
                    await this.setCapabilityValue('dim', Math.max(0.01, currentLevel / MAX_DIM));
                })
                .catch(err => {
                    this.log('---5', new Date())
                    this.error('Error: could not update dim capability value after `onoff` change', err);
                });
        }

        return undefined
    }

    async changeDimLevel(dim, opts = {}) {
        this.log('changeDimLevel() →', dim);

        if (dim === 0 && this.getCapabilityValue('onoff') === false) {
            this.log('--- return back')
            this.setCapabilityValue('dim', 0)
            return this.levelControlCluster.stopWithOnOff()
        }

        const moveToLevelWithOnOffCommand = {
            level: Math.round(dim * MAX_DIM),
            transitionTime: 0,
        };

        // Execute dim
        this.debug('changeDimLevel() → ', dim, moveToLevelWithOnOffCommand);
        return this.levelControlCluster.moveToLevelWithOnOff(moveToLevelWithOnOffCommand)
            .then(async result => {
                // Update onoff value
                if (dim === 0) {
                    await this.setCapabilityValue('onoff', false);
                } else if (this.getCapabilityValue('onoff') === false && dim > 0) {
                    await this.setCapabilityValue('onoff', true);
                }
                return result;
            });
    }




    //================================================================================================
    //================================================================================================

    async _onNodeInit2() {

        this.dimingToZero = false

        this.registerCapability('onoff', CLUSTER.ON_OFF)
        //this.registerCapability('dim', CLUSTER.LEVEL_CONTROL)

        this.registerCapability("dim", CLUSTER.LEVEL_CONTROL, {
            //set: value => (value ? 'setOn' : 'setOff'),
            setParser: function (setValue) {
                this.log('------dim setParser: ', setValue)
                return setValue
            },
            get: 'currentLevel',
            report: 'currentLevel',
            reportParser: function (value) {
                this.log('++++++++++++++++ dim reportParser = ', value)

                if (this.dimingToZero) {
                    this.log('++++++++++++++++ dim reportParser = ', value, '-set 0')
                    return 0
                }
                return value / MAX_DIM
            },
        });



        this.registerCapabilityListener("onoff", async isOn => {
            this.log('------------onoff-ui-send: ', isOn)


            this.dimingToZero = false

            let currentLevel1 = 0.01
            try {
                const { currentLevel } = await this.levelControlCluster2().readAttributes([CURRENT_LEVEL])
                currentLevel1 = currentLevel
            } catch (err) {
                this.setCapabilityValue("onoff", !isOn)
                this.log('error: ', err)
                await this.setWarning("" + err).catch(this.error);
            }


            currentLevel1 = this.getStoreValue(CURRENT_LEVEL) || currentLevel1
            this.log('------onoff - set-dim: ', currentLevel1)

            try {

                if (isOn) {
                    let result = this.changeDimLevel2(currentLevel1 / MAX_DIM)
                }
                else {
                    let result = this.changeDimLevel2(0)
                }

            } catch (error) {
                this.log('---------', error)
                await this.setWarning("" + error).catch(this.error);
            }

        })

        this.registerCapabilityListener('dim', async value => {
            this.log('###############level ui send: ', value)

            let currentLevel1 = 0
            try {
                const { currentLevel } = await this.levelControlCluster2().readAttributes([CURRENT_LEVEL])
                currentLevel1 = currentLevel
            } catch (err) {
                this.log('error: ', err)
                await this.setWarning("" + err).catch(this.error);
            }

            if (value === 0 && this.getCapabilityValue('onoff') === false) {
                this.setCapabilityValue('dim', 0)
                return
            }
            if (value === 1 && this.getCapabilityValue('onoff') === true && currentLevel1 === value * MAX_DIM) {
                this.setCapabilityValue('dim', 1)
                return
            }

            this.dimingToZero = false
            if (value === 0) {
                this.dimingToZero = true
            }

            this.setStoreValue(CURRENT_LEVEL, value * MAX_DIM)

            try {
                let result = this.changeDimLevel2(value)
                this.log('------changeDimLevel2 return: ', result)
                if (!result) {
                    await this.setWarning("" + result).catch(this.error);
                }
            } catch (error) {
                this.log('---------', error)
                await this.setWarning("" + error).catch(this.error);
            }


        })




        this.onoffCluster2().on('attr.onOff', async value => {
            this.log(' ############# report onoff: ', value)
            if (value === false) {
                await this.setCapabilityValue('dim', 0);
            }
        })

        this.levelControlCluster2().on('attr.currentLevel', async value => {
            this.log('############# report level: ', value)

            if (this.getCapabilityValue('onoff') === false) {
                this.setCapabilityValue('dim', 0)
            }

        })


        try {

            let currentLevel1 = 0.01
            try {
                const { currentLevel } = await this.levelControlCluster2().readAttributes([CURRENT_LEVEL])
                currentLevel1 = currentLevel
            } catch (err) {
                this.setCapabilityValue("onoff", !isOn)
                this.setCapabilityValue('dim', 0)
                this.log('error: ', err)
                await this.setWarning("" + err).catch(this.error);
            }

            await this.onoffCluster2().readAttributes(['onoff']).then(value => {
                this.log('-----read onoff : ', value)
                if (value.hasOwnProperty('onoff')) {
                    this.setCapabilityValue('onoff', value.onOff)
                    if (value.onOff === false) {
                        this.setCapabilityValue('dim', 0)
                    }
                }
            })


            await this.basicCluster2().readAttributes(['appVersion', 'dateCode', 'hwVersion', 'appProfileVersion', 'locationDesc', 'swBuildId']).then(value => {
                this.log('+++++++++++ basic : ', value)
            })
        } catch (error) {

        }

    }

    basicCluster2() { return this.zclNode.endpoints[1].clusters.basic }
    onoffCluster2() { return this.zclNode.endpoints[1].clusters.onOff }
    levelControlCluster2() { return this.zclNode.endpoints[1].clusters.levelControl; }


    async changeDimLevel2(dim, opts = {}) { 

        if (dim === 0) {
            this.dimingToZero = true
        }

        const moveToLevelWithOnOffCommand = {
            level: Math.round(dim * MAX_DIM),
            transitionTime: 0,
        };

        this.log('---------changeDimLevel2-1', new Date())
        return this.levelControlCluster.moveToLevelWithOnOff(moveToLevelWithOnOffCommand)
            .catch(err => {
                return "" + err
            })
            .then(async result => {
                // Update onoff value
                this.log('---------changeDimLevel2-2', new Date())
                if (dim === 0) {
                    await this.setCapabilityValue('onoff', false);
                    await this.setCapabilityValue('dim', 0)
                } else if (this.getCapabilityValue('onoff') === false && dim > 0) {
                    await this.setCapabilityValue('onoff', true);
                }
                this.log('---------changeDimLevel2-3', new Date())
                return result;
            }) 
    }
}

module.exports = D1402769_LightDevice
