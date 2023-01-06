const db = require("../models");
const Location = db.location;

exports.createLocation = async (locationData) => {
  if (!locationData.name) {
    const error = new Error("Name cannot be empty for location!");
    error.statusCode = 400;
    throw error;
  } else if (!locationData.type) {
    const error = new Error("Type cannot be empty for location!");
    error.statusCode = 400;
    throw error;
  } else if (!locationData.building) {
    const error = new Error("Building cannot be empty for location!");
    error.statusCode = 400;
    throw error;
  }

  // Create a Location
  const location = {
    id: locationData.id,
    name: locationData.name,
    type: locationData.type,
    building: locationData.building,
    description: locationData.description,
    status: locationData.status ? locationData.status : "active",
    groupId: locationData.groupId,
  };

  // Save Location in the database
  return await Location.create(location);
};

exports.findAllLocations = async () => {
  return await Location.findAll({
    order: [
      ["status", "ASC"],
      ["name", "ASC"],
    ],
  });
};

exports.findAllLocationsForGroup = async (groupId) => {
  return await Location.findAll({
    where: { groupId: groupId },
    order: [
      ["status", "ASC"],
      ["name", "ASC"],
    ],
  });
};

exports.findActiveLocationsForGroup = async (groupId) => {
  return await Location.findAll({
    where: { groupId: groupId, status: "active" },
    order: [["name", "ASC"]],
  });
};

exports.findOneLocation = async (id) => {
  return await Location.findByPk(id);
};

exports.updateLocation = async (location, id) => {
  return await Location.update(location, {
    where: { id: id },
  });
};

exports.deleteLocation = async (id) => {
  return await Location.destroy({
    where: { id: id },
  });
};

exports.deleteAllLocations = async () => {
  return await Location.destroy({
    where: {},
    truncate: false,
  });
};
