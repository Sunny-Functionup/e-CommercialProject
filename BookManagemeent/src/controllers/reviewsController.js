const ReviewModel= require("../models/reviewModel")
const BookModel = require("../models/bookModel");


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

const createReviews = async function(req, res){
    try {
        let data=req.body
        let bookId=req.params.bookId

        if (!isValidReqBody(data)) {
            res.status(400)
              .send({ status: false, message: "Please provide Reviews details" });
            return;
          }

        if (!isValid(data.bookId)) {
            res.status(400).send({ status: false, message: "BookId is required" });
            return;
        }        
        if (!isValid(data.reviewedBy)) {
            res.status(400).send({ status: false, message: "Reviewer's name is required" });
            return;
        }        
        if (!isValid(data.reviewedAt)) {
            res.status(400).send({ status: false, message: "Review Date is required" });
            return;
        }        
        if (!isValid(data.rating)) {
            res.status(400).send({ status: false, message: "Rating is required" });
            return;
        }
        
        if (!(/^[0-9a-fA-F]{24}$/.test(bookId) && /^[0-9a-fA-F]{24}$/.test(data.bookId))) {
            return res
              .status(400)
              .send({ status: false, message: "please provide valid BookId" });
          }
          if (!(/^((?:19|20)[0-9][0-9])-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])/.test(data.reviewedAt))) {
            res.status(400).send({ status: false, message: "Plz provide valid released Date" })
            return
          }        
        if(data.rating < 1 || data.rating > 5){
            return res
        .status(400)
        .send({ status: false, message: "Rating should be 1 to 5" });
        }
        let paramsBookId=await BookModel.findOne({_id:bookId, isDeleted:false})

        let bodyBookId=await BookModel.findOneAndUpdate({_id:data.bookId, isDeleted:false},{ $inc: { reviews: + 1 } }, { new: true }).select({__v:0})

        if(bookId != data.bookId){
            return res.status(400).send({status:false, message:"Plz provide similar BookId's in param and body"})
        }
        if(!(paramsBookId && bodyBookId)){
            return res.status(404).send({status:false, message:"Book data not found with this BookId"})
        }

        let reviewsData=await ReviewModel.create(data)
        res.status(201).send({status:true, message:"Reviews data created successfully", data:{...bodyBookId.toObject(), reviewsData:reviewsData}})

    } catch (err) {
        res.status(500).send({status:false, message:err.message})
    }
}

const updateReviews = async function(req, res){
    try {
        data=req.body
        bookId=req.params.bookId
        reviewId=req.params.reviewId

    if (!isValid2(data.rating)) {
        res.status(400).send({ status: false, message: "Title can't be empty" });
        return;
    }
    if (!isValid2(data.review)) {
        res.status(400).send({ status: false, message: "Review can't be empty" });
        return;
    }
    if (!isValid2(data.reviewedBy)) {
        res.status(400).send({ status: false, message: "Reviewer's name can't be empty" });
        return;
    }
    if(data.rating < 1 || data.rating > 5){
        return res
    .status(400)
    .send({ status: false, message: "Rating should be 1 to 5" });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(bookId)) {
        return res
          .status(400)
          .send({ status: false, message: "please provide valid BookId" });
    }
    if (!/^[0-9a-fA-F]{24}$/.test(reviewId)) {
        return res
          .status(400)
          .send({ status: false, message: "please provide valid ReviewId" });
    }
    const isBookIdPresent=await BookModel.findOne({_id:bookId, isDeleted:false})

    if(!isBookIdPresent){
        return res.status(404).send({status:false, message:"Book not found with this BookId"})
    }
    
    const isReviewIdPresent=await ReviewModel.findOne({_id:reviewId, isDeleted:false})

    if(!isReviewIdPresent){
        return res.status(404).send({status:false, message:"Review not found with this ReviewId"})
    }
    if(isReviewIdPresent.bookId!=bookId){
        return res.status(404).send({status:false, message:"Reviews not found with this BookId and ReviewId that you provid"})
    }

    const updatedReview=await ReviewModel.findByIdAndUpdate(reviewId, data,{new:true})
    res.status(200).send({status:true, message:"Reviews data updated successfully", data:{...isBookIdPresent.toObject(), reviewsData:updatedReview}})

    } catch (err) {
        res.status(500).send({status:false, message:err.message})
    }
}

const deleteReviews = async function(req, res){
    try {
        bookId=req.params.bookId
        reviewId=req.params.reviewId

        if (!/^[0-9a-fA-F]{24}$/.test(bookId)) {
            return res.status(400).send({ status: false, message: "please provide valid BookId" });
        }
        if (!/^[0-9a-fA-F]{24}$/.test(reviewId)) {
            return res.status(400).send({ status: false, message: "please provide valid ReviewId" });
        }
        const isBookIdPresent=await BookModel.findOneAndUpdate({_id:bookId, isDeleted:false},{ $inc: { reviews: -1 }},{new:true})

        if(!isBookIdPresent){
            return res.status(404).send({status:false, message:"Book not found with this BookId"})
        }
        
        const isReviewIdPresent=await ReviewModel.findOne({_id:reviewId, isDeleted:false})
    
        if(!isReviewIdPresent){
            return res.status(404).send({status:false, message:"Review not found with this ReviewId"})
        }
        if(isReviewIdPresent.bookId!=bookId){
            return res.status(404).send({status:false, message:"Reviews not found with this BookId and ReviewId that you provid"})
        }
        const deletedReview=await ReviewModel.findOneAndUpdate({_id:reviewId}, {isDeleted:true})
        res.status(200).send({status:true, message:"Review deleted successfully"})

    } catch (err) {
       res.status(500).send({status:false, message:err.message}) 
    }
}

module.exports={createReviews, updateReviews, deleteReviews}