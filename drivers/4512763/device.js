'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

const { CLUSTER } = require('zigbee-clusters');

class MotionSensor_4512763 extends ZigBeeDevice {

    onNodeInit({ zclNode }) {
        // Register measure_battery capability and configure attribute reporting

        // Refactored measure_battery to alarm battery, not all devices will have this capability
        if (this.hasCapability('alarm_battery')) {

            this.batteryThreshold = 20;
            this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION);
        }

        // Legacy: used to have measure_battery capability, removed due to inaccurate readings
        if (this.hasCapability('measure_battery')) {
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION);
        }

        // Illuminance Measurement  
        if (this.hasCapability('measure_luminance')) {
            this.registerCapability('measure_luminance', CLUSTER.ILLUMINANCE_MEASUREMENT);
        } 

        // alarm_motion
        // Capture the zoneStatusChangeNotification
        zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME]
            .onZoneStatusChangeNotification = payload => {
                this.onIASZoneStatusChangeNoficiation(payload);
            };

        this.resetOnTimeout();
    }



    /**
   * Update alarm capabilities based on the IASZoneStatusChangeNotification.
   */
    onIASZoneStatusChangeNoficiation({
        zoneStatus, extendedStatus, zoneId, delay,
    }) {
        this.log('motion2 received:', zoneStatus);
        this.setCapabilityValue('alarm_motion', zoneStatus.alarm1);
        this.setCapabilityValue('alarm_tamper', zoneStatus.tamper);
        this.setCapabilityValue('alarm_battery', zoneStatus.battery);

        this.resetOnTimeout();
    }

    resetOnTimeout() {
        // Set and clear motion timeout
        const alarmMotionResetWindow = this.getSetting('hacked_alarm_motion_reset_window') ? 5 : (this.getSetting('alarm_motion_reset_window') || 300);
        // Set a timeout after which the alarm_motion capability is reset
        if (this.motionAlarmTimeout) clearTimeout(this.motionAlarmTimeout);

        this.log("alarmMotionResetWindow =", alarmMotionResetWindow);

        this.motionAlarmTimeout = setTimeout(() => {
            this.log('manual alarm_motion reset');
            this.setCapabilityValue('alarm_motion', false).catch(this.error);
            this.setCapabilityValue('alarm_tamper', false).catch(this.error);
            this.setCapabilityValue('alarm_battery', false).catch(this.error);
        }, alarmMotionResetWindow * 1000);
    }

}

module.exports = MotionSensor_4512763;

