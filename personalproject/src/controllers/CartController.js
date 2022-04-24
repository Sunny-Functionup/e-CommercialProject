const validator = require('../utility/validator')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')

const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        let cartBody = req.body
        let tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid user id in Params' })
        }

        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(400).send({ status: false, message: `Provided UserId ${userId} Does not exists.` })
        }

        if (user._id != tokenUserId) {
            return res.status(401).send({ status: false, message: 'Unauthorized access!' })
        }

        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            
            if (!validator.isValidRequestBody(cartBody)) {
                return res.status(400).send({ status: false, message: 'Please provide cart data' })
            }

            const productId = req.body.items[0].productId

            if (!validator.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: 'Please provide valid product id in body' })
            }

            const product = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!product) {
                return res.status(404).send({ status: false, message: ' This product is already deleted' })
            }

            if(cartBody.items[0].quantity == 0) {
                return res.status(404).send({ status: false, message: 'Quantity can not be zero, Minimum value shuold be 1' })
            }

            const totalItems = cartBody.items.length

            const totalPrice = product.price * cartBody.items[0].quantity

            const cartData = { userId: userId, items: cartBody.items, totalPrice: totalPrice, totalItems: totalItems }

            const cart = await cartModel.create(cartData)

            return res.status(201).send({ status: true, message: 'cart created successfully', data: cart })
        }

        if (findCart) {

            if (!validator.isValidRequestBody(cartBody)) {
                return res.status(400).send({ status: false, message: 'Please provide card data' })
            }

            const productId = req.body.items[0].productId

            if (!validator.isValidObjectId(productId)) {
                return res.status(400).send({ status: false, message: 'Please provide valid product id in body' })
            }

            const product = await productModel.findOne({ _id: productId, isDeleted: false })

            if (!product) {
                return res.status(404).send({ status: false, message: 'This product is already deleted' })
            }

            for (let i = 0; i < findCart.items.length; i++) {

                if (productId == findCart.items[i].productId) {

                    const totalPrice = findCart.totalPrice + (product.price * cartBody.items[0].quantity)

                    findCart.items[i].quantity = findCart.items[i].quantity + cartBody.items[0].quantity

                    const newCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })

                    return res.status(201).send({ status: true, message: 'product added in cart', data: newCart })

                }
            }

            const totalItem = cartBody.items.length + findCart.totalItems

            const totalPrice = findCart.totalPrice + (product.price * cartBody.items[0].quantity)

            const newCart = await cartModel.findOneAndUpdate({ userId: userId },
                { $addToSet: { items: { $each: cartBody.items } }, totalPrice: totalPrice, totalItems: totalItem }, { new: true })

            return res.status(201).send({ status: true, message: 'product added in cart', data: newCart })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let tokenUserId = req.userId
        let updateBody = req.body

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid user id in Params' })
        }

        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: 'user does not exist with this userId' })
        }

        if (user._id != tokenUserId) {
            return res.status(401).send({ status: false, message: 'Unauthorized access!' })
        }

        if (!validator.isValidRequestBody(updateBody)) {
            return res.status(400).send({ status: false, message: 'Provide a product details in body to update the cart' })
        }

        const { cartId, productId, removeProduct } = updateBody

        if (!validator.isValidId(cartId)) {
            return res.status(400).send({ status: false, message: 'cartId is required' })
        }

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid cart id in body' })
        }

        if (!validator.isValidId(productId)) {
            return res.status(400).send({ status: false, message: 'productId is required' })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: 'Please provide valid product id in body' })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: 'product not exist or deleted' })
        }

        if (!validator.isValid(removeProduct)) {
            return res.status(400).send({ status: false, message: 'removeProduct should be present in body' })
        }

        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(400).send({ status: false, message: `removeProduct value should be either '0' or '1'` })
        }

        const findCart = await cartModel.findOne({ userId: userId, _id: cartId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: 'No cart found, please create cart a first' })
        }

        if (findCart.items.length == 0) {
            return res.status(400).send({ status: false, message: 'Cart of this user is already empty, Nothing to remove' })
        }

        if (removeProduct == 1) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - product.price
                    if (findCart.items[i].quantity > 1) {
                        findCart.items[i].quantity -= 1
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                        return res.status(200).send({ status: true, message: 'cart updated successfully', data: updateCart })
                    }
                    else {
                        totalItem = findCart.totalItems - 1
                        findCart.items.splice(i, 1)

                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, message: 'cart successfully removed', data: updateCart })
                    }
                }
            }
        }

        if (removeProduct == 0) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId != findCart.items[i].productId) {

                    return res.status(400).send({status: false, message: 'This product is not present in cart'})
                }
                if(productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - (product.price * findCart.items[i].quantity)
                    let totalItem = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                    let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalItems: totalItem, totalPrice: totalPrice }, { new: true })
                    return res.status(200).send({ status: true, message: 'item removed successfully', data: updateCart })
                }
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    } 
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const getCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        let tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid userId in params' })
        }

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} ` })
        }

        if (findUser._id != tokenUserId) {
            return res.status(401).send({ status: false, message: 'Unauthorized access!' })
        }

        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId}` })
        }

        return res.status(200).send({ status: true, message: 'Successfully fetched cart details', data: findCart })

    } 
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId 
        let tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid userId in params' })
        }

        const findUser = await userModel.findOne({ _id: userId })
        
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` })
        }

        if (findUser._id != tokenUserId) {
            return res.status(401).send({ status: false, message: 'Unauthorized access!' })
        }

        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
            return res.status(400).send({ status: false, message: `Cart doesn't exists by ${userId}` })
        }

        await cartModel.findOneAndUpdate({ userId: userId }, {$set: { items: [], totalPrice: 0, totalItems: 0 } })

        return res.status(204).send({ status: true, message: 'Cart successfully deleted' })

    } 
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports= {createCart, updateCart,getCart, deleteCart}