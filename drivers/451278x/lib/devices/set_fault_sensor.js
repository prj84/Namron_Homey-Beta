

 async function set_fault_sensor(device, faultValue) {

     // device.log('faultValue :', faultValue)
     const setValue = async (res) => {
         for (let i = 0; i < res.length; i++) {
             const faultEnum = res[i]
             const key = `t11_zg_fault_${faultEnum}`
             // 如果没有这个能力，则添加
             if (!device.hasCapability(key)) {
                 device.log('adding :', key)
                 await device.addCapability(key);
             }

             if (device.getCapabilityValue(key) !== faultEnum) {
                 device.log('setting :', key, faultEnum)
                 device.setCapabilityValue(key, faultEnum).catch(device.error)
             }
         }
     }
    if (faultValue.length > 0) {
        const res = faultValue.getBits();
        // 如果没有变化，不删除旧的能力
        if (device.old_res?.toString() === res.toString()) {
            await setValue(res)
            return
        }
        device._setUnavailble()
        const list = ['er0','er1', 'er2', 'er3', 'er4', 'er5', 'er6', 'er7']
        for (let i = 0; i < list.length; i++) {
            const faultEnum = list[i]
            const key = `t11_zg_fault_${faultEnum}`
            if (device.hasCapability(key)) {
                device.log('removing :', key)
                await device.removeCapability(key)
            }
        }
        await setValue(res)
        // 更新旧值
        device.old_res = res
        device.setAvailable()
    }
    // else {
    //     device.setCapabilityValue(`t11_zg_fault_er0`, '0').catch(device.error)
    // }
}

module.exports = {
    set_fault_sensor
}
