const userModel = require('./userModel');
const tagModel = require('./tagModel');
const photoModel = require('./photoModel');
const locationModel = require('./locationModel');

module.exports = {
  user: userModel,
  tag: tagModel,
  photo: photoModel,
  location: locationModel
};
