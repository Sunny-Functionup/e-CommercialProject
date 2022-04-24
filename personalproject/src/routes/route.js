const express = require('express')
const router = express.Router()

const userController = require('../controllers/UserController')
const productController = require('../controllers/ProductController')
const cartController = require('../controllers/CartController')
const orderController = require('../controllers/OrderController')

const middleware = require('../middleware/auth')

// User Api
router.post('/register', userController.registerUser)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile', middleware.auth, userController.getUserProfile)
router.put('/user/:userId/profile', middleware.auth, userController.updateProfile)

// // Product Api
router.post('/products', productController.createProduct)
router.get('/products', productController.getAllProducts)
router.get('/products/:productId', productController.getProductById)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteProduct)

// Cart Api
router.post('/users/:userId/cart', middleware.auth, cartController.createCart)
router.put('/users/:userId/cart', middleware.auth, cartController.updateCart)
router.get('/users/:userId/cart', middleware.auth, cartController.getCart)
router.delete('/users/:userId/cart', middleware.auth, cartController.deleteCart)

// Order Api
router.post('/users/:userId/orders', middleware.auth, orderController.createOrder)
router.put('/users/:userId/orders', middleware.auth, orderController.updateOrder)

module.exports = router