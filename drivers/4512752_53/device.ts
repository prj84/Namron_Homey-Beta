import TuyaThermostatDevice from '../../lib/TuyaThermostatDevice';

class ThermostatRegulatorDevice extends TuyaThermostatDevice {
  protected regulatorSupport = true;
}

module.exports = ThermostatRegulatorDevice;
