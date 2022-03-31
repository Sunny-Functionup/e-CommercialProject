const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: "title is required",
      enum: ["Mr", "Mrs", "Miss"],
    },
    name: { type: String, required: "name is required" },
    phone: { type: String, required: "phone is required" },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: "email is required",
    },
    password: {
      type: String,
      require: "password is required",
      minlength: 8,
      maxlength: 15,
    },
    address: {
      street: String,
      city: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", UserSchema);
