const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const bookController = require("../controllers/bookController");
const reviewsController = require("../controllers/reviewsController")

const BookMiddleware=require("../middlewares/bookMiddleware")


router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);

router.post("/books",BookMiddleware.mid1, bookController.createBook);
router.get("/books",BookMiddleware.mid1, bookController.getBook);

router.get("/books/:bookId",BookMiddleware.mid1,bookController.getBookByParams);
router.put("/books/:bookId",BookMiddleware.mid1, bookController.updateBook);
router.delete("/books/:bookId",BookMiddleware.mid1, bookController.deleteBook);

router.post("/books/:bookId/review",reviewsController.createReviews);
router.put("/books/:bookId/review/:reviewId",reviewsController.updateReviews);
router.delete("/books/:bookId/review/:reviewId",reviewsController.deleteReviews);





module.exports = router;
