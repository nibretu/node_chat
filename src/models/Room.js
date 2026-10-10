const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate room names
      trim: true,
    },
    // Optional: Track members for features like "user is typing"
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // If you have a User model from your auth app
      },
    ],
  },
  { timestamps: true },
); // Adds createdAt and updatedAt

module.exports = mongoose.model('Room', roomSchema);
