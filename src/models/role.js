const mongoose = require('mongoose');
const { userType } = require('../utils/enums');

const roleSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  name: {
    type: String,
    default: userType.USER,
  },
  permission: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;