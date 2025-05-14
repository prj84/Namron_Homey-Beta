'use strict'

module.exports = {
    eco_mode: require('./devices/eco_mode.js'),
    child_lock: require('./devices/child_lock'),
    frost: require('./devices/frost'),
    thermostat_regulator_mode: require('./devices/thermostat_regulator_mode'),
    regulator_percentage: require('./devices/regulator_percentage'),
    regulator: require('./devices/regulator'),
    sensor_mode: require('./devices/sensor_mode'),
    window_check: require('./devices/window_check'),
    window_status: require('./devices/window_status'),
    lcd_backlight_wait: require('./devices/lcd_backlight_wait'),
    systemMode: require('./devices/system_mode'),
    fault: require('./devices/fault'),
    run_mode: require('./devices/run_mode')
}


