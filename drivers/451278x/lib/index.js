'use strict'

module.exports = {

    eco_mode: require('./devices/eco_mode.js'),
    temperature_display_mode: require('./devices/temperature_display_mode'),
    child_lock: require('./devices/child_lock'),
    frost: require('./devices/frost'),

    thermostat_regulator_mode: require('./devices/thermostat_regulator_mode'),
    regulator_percentage: require('./devices/regulator_percentage'),

    regulator: require('./devices/regulator'),
    sensor_mode: require('./devices/sensor_mode'),
    window_check: require('./devices/window_check'),
    window_status: require('./devices/window_status'),
    lcd_backlight_wait: require('./devices/lcd_backlight_wait'),
    holiday_temp_set: require('./devices/holiday_temp_set'),
    holiday_temp_set_f: require('./devices/holiday_temp_set_f'),
    vacation_mode: require('./devices/vacation_mode'),
    auto_time: require('./devices/auto_time'),
    countdown_set: require('./devices/countdown_set'),
    systemMode: require('./devices/system_mode'),
    fault: require('./devices/fault'),
    run_mode: require('./devices/run_mode'),
    vacation_start_date: require('./devices/vacation_start_date'),
    vacation_end_date: require('./devices/vacation_end_date'),

    screenOnTime: require('./devices/screen_on_time'),
}


