'use strict'
const moment = require("moment-timezone");
module.exports = {
    setConfig(device, payload) {

        let now = new Date(payload).getTime()
        let offset = moment.tz.zone(device.homey.clock.getTimezone()).utcOffset(now)
        let date = parseInt(((now / 1000) + (-offset * 60)) / 86400)
        console.log('mmmmmmmmmmmmmmmmmmmmm:', offset, date, payload)
        let payload2 = {}
        payload2['vacation_start_date'] = date
        device.thermostatCluster().writeAttributes(payload2).then(() => {
            device.log('_____________set vacation_start_date ', date)
        }).catch(device.error)

    },
}