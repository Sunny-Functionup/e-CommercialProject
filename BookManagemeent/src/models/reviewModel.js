const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const ReviewSchema = new mongoose.Schema(
  {
    bookId: { type: ObjectId, required: "BookId is required", ref: "Book" },
    reviewedBy: { type: String, required: true, default: "Guest", value: "" },
    reviewedAt: { type: Date, required: true },
    rating: { type: Number, min: 1, max: 5, required: "Rating is required" },
    review: {type:String},
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("review", ReviewSchema);
