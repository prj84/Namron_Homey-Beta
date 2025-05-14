// lifeline validated

'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

const { CLUSTER, BoundCluster } = require('zigbee-clusters');

class WaterSensor_4512764 extends ZigBeeDevice {

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


        //水感警示
        // Capture the zoneStatusChangeNotification
        zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME]
            .onZoneStatusChangeNotification = payload => {
                this.onIASZoneStatusChangeNoficiation(payload);
            };
    }

    /**
     * Update alarm capabilities based on the IASZoneStatusChangeNotification.
     */
    onIASZoneStatusChangeNoficiation({
        zoneStatus, extendedStatus, zoneId, delay,
    }) {
        this.log('water2 received:', zoneStatus);
        this.setCapabilityValue('alarm_water', zoneStatus.alarm1);
    }


}

module.exports = WaterSensor_4512764;

