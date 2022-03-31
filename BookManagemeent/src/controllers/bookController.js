const BookModel = require("../models/bookModel");
const UserModel = require("../models/userModel");
const ReviewModel = require("../models/reviewModel");


const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
const isValid2 = function (value) {
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
const isValidReqBody = function (data) {
  return Object.keys(data).length > 0;
};

const createBook = async function (req, res) {
  try {
    let data = req.body;


    if (!isValidReqBody(data)) {
      res.status(400)
        .send({ status: false, message: "Please provide Books details" });
      return;
    }

    if (!isValid(data.title)) {
      res.status(400).send({ status: false, message: "Title is required" });
      return;
    }

    if (!isValid(data.excerpt)) {
      res.status(400).send({ status: false, message: "Excerpt is required" });
      return;
    }

    if (!isValid(data.userId)) {
      res.status(400).send({ status: false, message: "UserId is required" });
      return;
    }
    if (!isValid(data.ISBN)) {
      res.status(400).send({ status: false, message: "ISBN is required" });
      return;
    }
    if (!isValid(data.category)) {
      res.status(400).send({ status: false, message: "Category is required" });
      return;
    }
    if (!isValid(data.subcategory)) {
      res
        .status(400)
        .send({ status: false, message: "Subcategory is required" });
      return;
    }

    if (!isValid(data.releasedAt)) {
      res
        .status(400)
        .send({ status: false, message: "Released Date is required" });
      return;
    }

    if (!(/^((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])/.test(data.releasedAt))) {
      res.status(400).send({ status: false, message: "Plz provide valid released Date" })
      return
    }
    if (!/^[0-9a-fA-F]{24}$/.test(data.userId)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid UserId" });
    }
    if (!(/^\+?([1-9]{3})\)?[-. ]?([0-9]{10})$/.test(data.ISBN))) {
      return res.status(400).send({ status: false, message: 'please provide valid ISBN' })
    }

    if(req.user != data.userId){
      return res.status(403).send({status:false, message:"You are not authorized to Create this Book"})
    }

    data.subcategory=data.subcategory.filter(e=>e.trim())

    if(data.subcategory.length==0){
      return res.status(400).send({status:false, msg:"Subcategory can't be empty"})
    }
    

    let isTitlePresent = await BookModel.findOne({ title: data.title });
    if (isTitlePresent) {
      return res.status(400).send({ status: false, message: "Book Title is already exist" });
    }

    let isUserIdPresent = await UserModel.findOne({ _id: data.userId });
    if (!isUserIdPresent) {
      return res.status(404).send({ status: false, message: "User Id is not found" });
    }

    let isISBNPresent = await BookModel.findOne({ ISBN: data.ISBN });
    if (isISBNPresent) {
      return res.status(400).send({ status: false, message: "ISBN is already exist" });
    }

    let bookCreated = await BookModel.create(data);
    res.status(201).send({ status: true, message: "Success", data: bookCreated});
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const getBook = async function (req, res) {
  try {
    let { userId, category, subcategory } = req.query;
    let obj = {};
    if (userId != null) obj.userId = userId;
    if (category != null) obj.category = category;
    if (subcategory != null) obj.subcategory = subcategory;

    obj.isDeleted = false;

    if ((userId) && (!/^[0-9a-fA-F]{24}$/.test(userId))) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid UserId" });
    }

    let bookData = await BookModel.find(obj).select({
      _id: 1,
      title: 1,
      excerpt: 1,
      userId: 1,
      category: 1,
      releasedAt: 1,
      reviews: 1,
    });

    bookData.sort(function (first, last) {
      return first.title.localeCompare(last.title);
    });

    if (bookData.length > 0) {
      res.status(200).send({ status: true, message: bookData });
    } else {
      res.status(404).send({ status: false, message: "Book Data not found" });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const getBookByParams = async function (req, res) {
  try {
    let bookId = req.params.bookId;

    if (!/^[0-9a-fA-F]{24}$/.test(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid BookId" });
    }

    let isBookIdPresent = await BookModel.findOne({_id: bookId, isDeleted: false}).select({__v: 0});
    if (!isBookIdPresent) { 
      res.status(404).send({ status: false, message: `Book data not found with this Id ${bookId}`});
      return;
    }


    let reviewsData = await ReviewModel.find({ bookId: bookId, isDeleted:false });

    res.status(200).send({status: true, message: "Books List", data: {...isBookIdPresent.toObject(), reviews:reviewsData.length, reviewsData: reviewsData }});

  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const updateBook= async function(req, res){
  try {
    let bookId=req.params.bookId
    let data=req.body

    if (!/^[0-9a-fA-F]{24}$/.test(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid BookId" });
    }

    if (!isValidReqBody(data)) {
      res.status(400)
        .send({ status: false, message: "Please provide some data to update this Book" });
      return;
    }

    if (!isValid2(data.title)) {
      res.status(400).send({ status: false, message: "Title can't be empty" });
      return;
    }
    if (!isValid2(data.ISBN)) {
      res.status(400).send({ status: false, message: "ISBN no. can't be empty" });
      return;
    }
    if (!isValid2(data.excerpt)) {
      res.status(400).send({ status: false, message: "Excerpt can't be empty" });
      return;
    }
    if (!isValid2(data.releasedAt)) {
      res.status(400).send({ status: false, message: "Released date can't be empty" });
      return;
    }
    if (data.releasedAt && !(/^((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])/.test(data.releasedAt))) {
      res.status(400).send({ status: false, message: "Plz provide valid released Date" })
      return
    }
    if (data.ISBN && !(/^\+?([1-9]{3})\)?[-. ]?([0-9]{10})$/.test(ISBN))) {
      return res.status(400).send({ status: false, message: 'please provide valid ISBN' })
    }

    let isBookIdPresent = await BookModel.findOne({_id: bookId, isDeleted: false});
    if (!isBookIdPresent) { 
      res.status(404).send({ status: false, message: `Book data not found with this Id ${bookId}`});
      return;
    }
    if(req.user != isBookIdPresent.userId){
      return res.status(403).send({status:false, message:"You are not authorized to update this Book"})
    }

    let isTitlePresent = await BookModel.findOne({ title: data.title });
    if (isTitlePresent) {
      return res.status(400).send({ status: false, message: "Book Title is already exist you can't update it" });
    }

    let isISBNPresent = await BookModel.findOne({ ISBN: data.ISBN });
    if (isISBNPresent) {
      return res.status(400).send({ status: false, message: "ISBN no. is already exist you can't update it" });
    }


    let bookData= await BookModel.findByIdAndUpdate(bookId, data,{new:true})
    res.status(200).send({ status: true, message: bookData });

  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
}

const deleteBook = async function(req, res){
  try {
    let bookId=req.params.bookId

    if (!/^[0-9a-fA-F]{24}$/.test(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "please provide valid BookId" });
    }

    let isBookPresent = await BookModel.findOne({_id:bookId, isDeleted:false})
    if(!isBookPresent){
      return res.status(404).send({status:false, message:"Book not found"})
    }
    if(req.user != isBookPresent.userId){
      return res.status(403).send({status:false, message:"You are not authorized to Delete this Book"})
    }

    let bookData=await BookModel.findByIdAndUpdate({_id:bookId},{isDeleted:true, deletedAt:new Date()})
    res.status(200).send({status:true, message:"Book Deleted successfully"})

  } catch (err) {
    res.status(500).send({status:false, message:err.message})
  }
}
module.exports = { createBook, getBook, getBookByParams,updateBook, deleteBook };