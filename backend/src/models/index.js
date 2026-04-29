const userModel = require('./userModel');
const tagModel = require('./tagModel');
const photoModel = require('./photoModel');
const locationModel = require('./locationModel');
const searchModel = require('./searchModel');

module.exports = {
  user: userModel,
  tag: tagModel,
  photo: photoModel,
  location: locationModel,
  search: searchModel
};
