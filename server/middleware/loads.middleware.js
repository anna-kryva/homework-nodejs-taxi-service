const Load = require('../models/Load');
const Truck = require('../models/Truck');

const logging = require('../logs/log');

module.exports = async (loadId) => {
  try {
    const load = await Load.findById(loadId);
    logging('System.Info', 'Load is found');

    const truck = await Truck.where('assignedTo').ne(null)
        .where('status').equals('IS')
        .where('payload').gt(load.payload)
        .where('width').gt(load.dimensions.width)
        .where('length').gt(load.dimensions.length)
        .where('height').gt(load.dimensions.height)
        .findOne();

    logging('System.Info', 'Looking for truck');

    let updateLogs = [...load.logs];

    if (!truck) {
      updateLogs.push({ 
        message:
        'Changed status to NEW. There is no appropriate truck',
        time: Date.now(),
      });

      await Load.findByIdAndUpdate(
          loadId,
          {
            status: 'NEW',
            logs: updateLogs,
          },
      );

      logging('System.Info', 'There is no appropriate truck');
      return {
        state: 'No truck'
      };
    }

    await Truck.findByIdAndUpdate(truck._id, {status: 'OL'});
    logging('System.Info', 'Truck status is updated');

    updateLogs.push({
      message:
      'Load is assigned. Driver is en route',
      time: Date.now(),
    });

    await Load.findByIdAndUpdate(
        loadId,
        {
          status: 'ASSIGNED',
          state: 'En route to Pick Up',
          logs: updateLogs,
          assignedTo: truck.assignedTo,
        },
    );

    logging('Info', 'Load is en route');
    return {
      state: 'En route',
      driverId: truck.assignedTo
    };
  } catch (e) {
    logging('Error', `Some problems in system, ${e}`);
    return {
      state: 'Error'
    };
  }
};
