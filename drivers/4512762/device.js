'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

const { CLUSTER } = require('zigbee-clusters');

class DoorSensor extends ZigBeeDevice {

    onNodeInit({ zclNode }) {

        // Refactored measure_battery to alarm battery, not all devices will have this capability
        if (this.hasCapability('alarm_battery')) {

            this.batteryThreshold = 20;
            this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION);
        }

        // Legacy: used to have measure_battery capability, removed due to inaccurate readings
        if (this.hasCapability('measure_battery')) {
            this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION);
        }

        if (this.hasCapability('alarm_tamper')) {
            this.registerCapability('alarm_tamper', CLUSTER.POWER_CONFIGURATION);
        }


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
        this.log('door2 received:', zoneStatus);
        this.setCapabilityValue('alarm_contact', zoneStatus.alarm1);
        this.setCapabilityValue('alarm_tamper', zoneStatus.tamper);

        this.resetOnTimeout();
    }

    resetOnTimeout() {
        // Set and clear door timeout
        const alarmdoorResetWindow = this.getSetting('hacked_alarm_door_reset_window') ? 5 : (this.getSetting('alarm_door_reset_window') || 300);
        // Set a timeout after which the alarm_door capability is reset
        if (this.doorAlarmTimeout) clearTimeout(this.doorAlarmTimeout);

        this.log("alarmdoorResetWindow =", alarmdoorResetWindow);

        this.doorAlarmTimeout = setTimeout(() => {
            this.log('manual alarm_door reset');
            this.setCapabilityValue('alarm_contact', false).catch(this.error);
        }, alarmdoorResetWindow * 1000);
    }


}

module.exports = DoorSensor;