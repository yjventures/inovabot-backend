const mongoose = require("mongoose");

const functionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    parameters: {
      type: {
        type: {
          type: String,
        },
        properties: {
          type: Object,
        },
        required: {
          type: [
            {
              type: String,
            }
          ]
        }
      },
      default: {
        type: 'object',
        properties: {},
        required: []
      },
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", functionSchema);
module.exports = Address;
