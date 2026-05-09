const userModel = require("./userModel");
const tagModel = require("./tagModel");
const photoModel = require("./photoModel");
const locationModel = require("./locationModel");
const searchModel = require("./searchModel");
const likeModel = require("./likeModel");
const visitModel = require("./visitModel");
const messageModel = require("./messageModel");
const notificationModel = require("./notificationModel");
const blockModel = require("./blockModel");

module.exports = {
  user: userModel,
  tag: tagModel,
  photo: photoModel,
  location: locationModel,
  search: searchModel,
  like: likeModel,
  visit: visitModel,
  message: messageModel,
  notification: notificationModel,
  block: blockModel,
};
