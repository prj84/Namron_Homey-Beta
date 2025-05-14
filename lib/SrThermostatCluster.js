'use strict'

const { Cluster, ThermostatCluster, ZCLDataTypes, zclTypes } = require(
  'zigbee-clusters')

const ATTRIBUTES = {
  localTemperature: { id: 0, type: ZCLDataTypes.int16 },
  outdoorTemperature: { id: 1, type: ZCLDataTypes.int16 },
  occupancy: { id: 2, type: ZCLDataTypes.map8('occupied') },
  absMinHeatSetpointLimit: { id: 3, type: ZCLDataTypes.int16 },
  absMaxHeatSetpointLimit: { id: 4, type: ZCLDataTypes.int16 },
  absMinCoolSetpointLimit: { id: 5, type: ZCLDataTypes.int16 },
  absMaxCoolSetpointLimit: { id: 6, type: ZCLDataTypes.int16 },
  pICoolingDemand: { id: 7, type: ZCLDataTypes.uint8 },
  pIHeatingDemand: { id: 8, type: ZCLDataTypes.uint8 },
  localTemperatureCalibration: { id: 16, type: ZCLDataTypes.int8 },
  occupiedCoolingSetpoint: { id: 17, type: ZCLDataTypes.int16 },
  occupiedHeatingSetpoint: { id: 18, type: ZCLDataTypes.int16 },
  unoccupiedCoolingSetpoint: { id: 19, type: ZCLDataTypes.int16 },
  unoccupiedHeatingSetpoint: { id: 20, type: ZCLDataTypes.int16 },
  minHeatSetpointLimit: { id: 21, type: ZCLDataTypes.int16 },
  maxHeatSetpointLimit: { id: 22, type: ZCLDataTypes.int16 },
  minCoolSetpointLimit: { id: 23, type: ZCLDataTypes.int16 },
  maxCoolSetpointLimit: { id: 24, type: ZCLDataTypes.int16 },
  minSetpointDeadBand: { id: 25, type: ZCLDataTypes.int8 },
  remoteSensing: {
    id: 26,
    type: ZCLDataTypes.map8('localTemperature', 'outdoorTemperature',
      'occupancy'),
  },
  backlightSwitch: {
    id: 0x8009,
    type: ZCLDataTypes.bool
  },
  regulator_percentage: {id: 32797, type: ZCLDataTypes.int16},
  absMinHeatSetpointLimitF: {id: 32780, type: ZCLDataTypes.int16},
  absMaxHeatSetpointLimitF: {id: 32781, type: ZCLDataTypes.int16},
  absMinCoolSetpointLimitF: {id: 32782, type: ZCLDataTypes.int16},
  absMaxCoolSetpointLimitF: {id: 32783, type: ZCLDataTypes.int16},
  occupiedCoolingSetpointF: {id: 32784, type: ZCLDataTypes.int16},
  occupiedHeatingSetpointF: {id: 32785, type: ZCLDataTypes.int16},
  localTemperatureF: {id: 32786, type: ZCLDataTypes.int16},

  controlSequenceOfOperation: {
    id: 27,
    type: ZCLDataTypes.enum8({
      cooling: 0,
      coolingWithReheat: 1,
      heating: 2,
      heatingWithReheat: 3,
      coolingAndHeating4Pipes: 4,
      coolingAndHeating4PipesWithReheat: 5,
    }),
  },
  systemMode: {
    id: 28,
    type: ZCLDataTypes.enum8({
      off: 0,
      auto: 1,
      cool: 3,
      heat: 4,
      emergencyHeating: 5,
      precooling: 6,
      fanOnly: 7,
      dry: 8,
      sleep: 9,
    }),
  },
  alarmMask: {
    id: 29,
    type: ZCLDataTypes.map8('initializationFailure', 'hardwareFailure',
      'selfCalibrationFailure'),
  },
  startOfWeek: {
    id: 0x20,
    type: ZCLDataTypes.enum8({
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    }),
  },
  // Private attributes
  controlType: {
    id: 0x1003,
    type: ZCLDataTypes.enum8({
      room: 0,
      floor: 1,
      roomFloor: 2,
      other: 3,
    }),
    manufacturerId: 0x1224,
  },
  displayTemperature: {
    id: 0x1008,
    type: ZCLDataTypes.enum8({
      room: 0,
      floor: 1,
    }),
    manufacturerId: 0x1224,
  },
  operateDisplayBrightness: {
    id: 0x1000,
    type: ZCLDataTypes.enum8({
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
    }),
    manufacturerId: 0x1224,
  },
  displayAutoOffActivation: {
    id: 0x1001,
    type: ZCLDataTypes.enum8({
      disabled: 0,
      enabled: 1,
    }),
    manufacturerId: 0x1224,
  },
  powerUpStatus: {
    id: 0x1004,
    type: ZCLDataTypes.enum8({
      latestMode: 1,
      manualMode: 0,
    }),
    manufacturerId: 0x1224,
  },
  windowOpenCheck: {
    id: 0x1009,
    type: ZCLDataTypes.enum8({
      disabled: 0,
      enabled: 1,
    }),
    manufacturerId: 0x1224,
  },
  hysteresis: {
    id: 0x100A,
    type: ZCLDataTypes.uint8,
    manufacturerId: 0x1224,
  },
  windowOpenFlag: {
    id: 0x100B,
    type: ZCLDataTypes.enum8({
      closed: 0,
      opened: 1,
    }),
    manufacturerId: 0x1224,
  },
  internalOverHeat: {
    id: 0x2002,
    type: ZCLDataTypes.enum8({
      none: 0,
      level1: 1,
      level2: 2,
    }),
    manufacturerId: 0x1224,
  },
  sensorMode: {
    id: 0x8004,
    type: ZCLDataTypes.enum8({
      a: 0,
      f: 1,
      af: 2,
      a2: 3,
      a2f: 4,
      fp: 5,
      p: 6,
    }),
  },

  thermostatRunningMode: {
    id: 30,
    type: ZCLDataTypes.enum8({
      off: 0,
      cool: 3,
      heat: 4,
      idle: 16,
    })
  },


  thermostatProgramOperModel: {
    id: 37,
    //type: ZCLDataTypes.map8('program', 'manual', 'eco', 'set_eco'),
    type: ZCLDataTypes.map8('program', 'auto', 'eco')
  },

  windowCheck: {
    id: 32768,
    type: ZCLDataTypes.bool,
  },

  frost: {
    id: 32769,  //0x8001
    type: ZCLDataTypes.bool
  },


  windowState: {
    id: 32770,  //0x8002
    type: ZCLDataTypes.bool,
  },

  workDays: {
    id: 0x8003,
    type: ZCLDataTypes.int8,
  },

  countdown_set: {
    id: 0x8023,
    type: ZCLDataTypes.enum8({
      '0': 0,
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      '11': 11,
      '12': 12,
      '13': 13,
      '14': 14,
      '15': 15,
      '16': 16,
      '17': 17,
      '18': 18,
      '19': 19,
      '20': 20,
      '21': 21,
      '22': 22,
      '23': 23,
      '24': 24
    }),
  },

  countdown_left: {
    id: 0x8024,
    type: ZCLDataTypes.int16,
  },

  vacation_start_date: {
    id: 0x8020,
    type: ZCLDataTypes.uint32,
  },

  vacation_end_date: {
    id: 0x8021,
    type: ZCLDataTypes.uint32,
  },

  backlight: {
    id: 0x8005,
    type: ZCLDataTypes.uint8,
  },

  vacation_mode: {
    id: 0x801F,
    type: ZCLDataTypes.bool,
  },

  auto_time: {
    id: 0x8022,
    type: ZCLDataTypes.bool,
  },

  holiday_temp_set: {
    id: 0x8013,
    type: ZCLDataTypes.int16,
  },

  holiday_temp_set_f: {
    id: 0x801B,
    type: ZCLDataTypes.int16,
  },



  regulator: {
    id: 0x8007,
    type: ZCLDataTypes.uint8,
  },

  dryModeCountDown: {
    id: 0x8008,
    type: ZCLDataTypes.int8,
  },

  syncTimeReq: {
    id: 0x800A,
    type: ZCLDataTypes.bool
  },

  syncTime: {
    id: 0x800B,
    type: ZCLDataTypes.uint32
  }
}

Object.assign(ATTRIBUTES, {
  runningState: {
    id: 41,
    type: ZCLDataTypes.enum8({
      idle: 0,
      heat: 1,
      cool: 2,
      pending: 3,
      timing: 4,
    })
  },
  vacation_days: {
    id: 0x802A,
    type: ZCLDataTypes.uint8,
  },

  frost_temp: {
    id: 0x802B,
    type: ZCLDataTypes.uint8,
  },

  frost_temp_f: {
    id: 0x802C,
    type: ZCLDataTypes.uint16,
  },
  idle_bklight: {
    id: 0x802D,
    type: ZCLDataTypes.uint8,
  },
  timer_mode: {
    id: 0x802E,
    type: ZCLDataTypes.bool,
  },
  temp_correction : {
    id: 0x8031,
    type: ZCLDataTypes.int8,
  },
  temp_correction_f: {
    id: 0x802F,
    type: ZCLDataTypes.int16,
  },
  factory_reset: {
    id: 0x8030,
    type: ZCLDataTypes.bool,
  },
  fault: {
    id: 0x8006,
    type: ZCLDataTypes.map8('er0','er1', 'er2', 'er3', 'er4', 'er5', 'er6', 'er7', 'er8')
  },
  maxHeatTemp: {
    id: 0x8025,
    type: ZCLDataTypes.int16
  },
  maxHeatTemp_f: {
    id: 0x8026,
    type: ZCLDataTypes.int16
  },
  minCoolTemp: {
    id: 0x8027,
    type: ZCLDataTypes.int16
  },
  minCoolTemp_f: {
    id: 0x8028,
    type: ZCLDataTypes.int16
  },

  screenOnTime: {
    id: 0x8029,
    type: ZCLDataTypes.enum8({
      '0': 0,
      '1': 1,
      '2': 2,
      '3': 3,
    })
  },
})

const COMMANDS = {
  setSetpoint: {
    id: 0,
    args: {
      mode: ZCLDataTypes.enum8({
        heat: 0,
        cool: 1,
        both: 2,
      }),
      amount: ZCLDataTypes.int8,
    },
  },

  setEco: {
    id: 0x08,
    args: {
      ecoMode: ZCLDataTypes.bool
    }
  },

  setProgram: {
    id: 0x07,
    args: {
      runMode: ZCLDataTypes.bool
    }
  },

  setWeeklySchedule: {
    id: 1,
    args: {
      numberOfTransition: ZCLDataTypes.enum8({
        'zero': 0,
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
      }),
      dayOfWeek: ZCLDataTypes.map8('sun', 'mon', 'tue', 'wed', 'thu', 'fri',
        'sat', 'awayOrVacation'),
      mode: ZCLDataTypes.map8('heat', 'cool'),
      transitionTime1: ZCLDataTypes.uint16,
      heatSet1: ZCLDataTypes.int16,
      transitionTime2: ZCLDataTypes.uint16,
      heatSet2: ZCLDataTypes.int16,
      transitionTime3: ZCLDataTypes.uint16,
      heatSet3: ZCLDataTypes.int16,
      transitionTime4: ZCLDataTypes.uint16,
      heatSet4: ZCLDataTypes.int16,
    },
  },
  getWeeklySchedule: {
    id: 2,
    args: {
      daysToReturn: ZCLDataTypes.map8('sun', 'mon', 'tue', 'wed', 'thu', 'fri',
        'sat', 'awayOrVacation'),
      modeToReturn: ZCLDataTypes.map8('heat', 'cool'),
    },
  },
  getWeeklyScheduleResponse: {
    id: 0,
    args: {
      numberOfTransition: ZCLDataTypes.enum8({
        'zero': 0,
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
      }),
      dayOfWeek: ZCLDataTypes.map8('sun', 'mon', 'tue', 'wed', 'thu', 'fri',
        'sat', 'awayOrVacation'),
      /* dayOfWeek: ZCLDataTypes.uint8, */
      mode: ZCLDataTypes.map8('heat', 'cool'),
      transitionTime1: ZCLDataTypes.uint16,
      heatSet1: ZCLDataTypes.int16,
      transitionTime2: ZCLDataTypes.uint16,
      heatSet2: ZCLDataTypes.int16,
      transitionTime3: ZCLDataTypes.uint16,
      heatSet3: ZCLDataTypes.int16,
      transitionTime4: ZCLDataTypes.uint16,
      heatSet4: ZCLDataTypes.int16,
    },
  },
}

class SrThermostatCluster extends ThermostatCluster {

  static get ATTRIBUTES () {
    return ATTRIBUTES
  }

  static get COMMANDS () {
    return COMMANDS
  }

}

module.exports = SrThermostatCluster
