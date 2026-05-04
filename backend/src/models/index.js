const userModel = require('./userModel');
const tagModel = require('./tagModel');
const photoModel = require('./photoModel');
const locationModel = require('./locationModel');
const searchModel = require('./searchModel');
const likeModel = require('./likeModel');
const visitModel = require('./visitModel');

module.exports = {
  user: userModel,
  tag: tagModel,
  photo: photoModel,
  location: locationModel,
  search: searchModel,
  like: likeModel,
  visit: visitModel
};
