const validator = require('../utility/validator')
const config = require('../utility/awsConfig')
const productModel = require('../models/productModel')
const currencySymbol = require("currency-symbol-map")


const createProduct = async function (req, res) {
    try {

        let files = req.files;
        let productBody = req.body;

        if (!validator.isValidRequestBody(productBody)) {
            return res.status(400).send({ status: false, msg: 'Please provide valid product body' })
        }

        let { title, description, productImage, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = productBody

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, msg: 'Title is required' })
        }
        const titleAleadyUsed = await productModel.findOne({ title })
        if (titleAleadyUsed) {
            return res.status(400).send({ status: false, msg: `${title} is alraedy in use. Please use another title` })
        }

        if (!validator.isValidRequestBody(files)) {
            return res.status(400).send({ status: false, msg: 'Product Image is required' })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, msg: 'Description is required' })
        }

        if (!validator.validString(productImage)) {
            return res.status(400).send({ status: false, msg: 'profile image is required' })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, msg: 'Price is required' })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: 'currencyId is required' })
        }

        if (currencyId != 'INR') {
            return res.status(400).send({ status: false, msg: 'currencyId should be INR' })
        }

        if (!validator.isValid(currencyFormat)) {
            currencyFormat = currencySymbol('INR')
        }
        currencyFormat = currencySymbol('INR')


        if (style) {
            if (!validator.validString(style)) {
                return res.status(400).send({ status: false, msg: 'style is required' })
            }
        }

        if (installments) {
            if (!validator.isValid(installments)) {
                return res.status(400).send({ status: false, msg: 'installments required' })
            }
        }
        if (installments) {
            if (!validator.validInstallment(installments)) {
                return res.status(400).send({ status: false, msg: `installments must be more than 1 and not decimal` })
            }
        }

        if (isFreeShipping) {
            if (!(isFreeShipping != true)) {
                return res.status(400).send({ status: false, msg: 'isFreeShipping must be a boolean value' })
            }
        }

        productImage = await config.uploadFile(files[0])

        const productData = { title, description, productImage, price, currencyId, currencyFormat: currencyFormat, isFreeShipping, style, availableSizes, installments, productImage: productImage }

        if (availableSizes) {
            let size = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < size.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
                }
            }
            if (size) {
                productData.availableSizes = size
            }
        }
        const saveProductDetails = await productModel.create(productData)
        return res.status(201).send({ status: true, msg: 'Successfully product created', data: saveProductDetails })

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getAllProducts = async function (req, res) {
    try {
        const filterdata = { isDeleted: false } //complete object details.
        const queryParams = req.query;

        if (validator.isValidRequestBody(queryParams)) {
            const { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams;

            //validation starts.
            if (validator.isValid(size)) {
                filterdata['availableSizes'] = size
            }

            //using $regex to match the subString of the names of products & "i" for case insensitive.
            if (validator.isValid(name)) {
                filterdata['title'] = {}
                filterdata['title']['$regex'] = name
                filterdata['title']['$options'] = 'i'
            }

            //setting price for ranging the product's price to fetch them.
            if (validator.isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, msg: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, msg: `priceGreaterThan should be a valid number` })
                }
                if (!Object.prototype.hasOwnProperty.call(filterdata, 'price'))
                    filterdata['price'] = {}
                filterdata['price']['$gte'] = Number(priceGreaterThan)
                console.log(typeof Number(priceGreaterThan))
            }

            //setting price for ranging the product's price to fetch them.
            if (validator.isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, msg: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, msg: `priceLessThan should be a valid number` })
                }
                if (!Object.prototype.hasOwnProperty.call(filterdata, 'price'))
                    filterdata['price'] = {}
                filterdata['price']['$lte'] = Number(priceLessThan)
                //console.log(typeof Number(priceLessThan))
            }

            //sorting the products acc. to prices => 1 for ascending & -1 for descending.
            if (validator.isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, msg: `priceSort should be 1 or -1 ` })
                }

                const products = await productModel.find(filterdata).sort({ price: priceSort })
                // console.log(products)
                if (Array.isArray(products) && products.length === 0) {
                    return res.status(404).send({ productStatus: false, msg: 'No Product found' })
                }

                return res.status(200).send({ status: true, msg: 'product list', data2: products })
            }
        }

        const products = await productModel.find(filterdata)

        //verifying is it an array and having some data in that array.
        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ productStatus: false, msg: 'No product found' })
        }

        return res.status(200).send({ status: true, msg: 'product list', data: products })
    } catch (error) {
        return res.status(500).send({ success: false, error: error.msg });
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, msg: `Product not found with ${productId} id` })
        }

        return res.status(200).send({ status: true, msg: 'Product found successfully', data: product })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.msg })
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////
const updateProduct = async function (req, res) {
    try {
        const requstBody = req.body
        const productid = req.params.productId

        // Validations
        if (!validator.isValidObjectId(productid)) {
            return res.status(400).send({ status: false, msg: `${productid} is not valid product id` })
        }

        const product = await productModel.findOne({ _id: productid, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, msg: `product not found` })
        }

        if (!(validator.isValidRequestBody(requstBody) || req.files)) {
            return res.status(400).send({ status: false, msg: 'No paramateres passed, product still unmodified', data: product })
        }

        // Extracting parameters here
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requstBody;

        //Here using hasOwnProperty method to match the keys and then setting the values

        const updateproductdata = {}         //empty object

        if (validator.isValid(title)) {

            const istitleAlreadyUsed = await productModel.findOne({ title: title });

            if (istitleAlreadyUsed) {
                return res.status(400).send({ status: false, msg: `this ${title} title is already used` })
            }

            if (!updateproductdata.hasOwnProperty('title'))
                updateproductdata['title'] = title
        }

        if (validator.isValid(description)) {
            if (!updateproductdata.hasOwnProperty('description'))
                updateproductdata['description'] = description
        }

        //verifying price is number & must be greater than 0.
        if (validator.isValid(price)) {

            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, msg: `Price should be a valid number` })
            }

            if (price <= 0) {
                return res.status(400).send({ status: false, msg: `Price should be a valid number` })
            }

            if (!updateproductdata.hasOwnProperty('price'))
                updateproductdata['price'] = price
        }
        //Checking currency inputs
        if (validator.isValid(currencyId)) {

            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, msg: 'currencyId should be a INR' })
            }

            if (!updateproductdata.hasOwnProperty('currencyId'))
                updateproductdata['currencyId'] = currencyId;
        }

        //checking shipping status here
        if (validator.isValid(isFreeShipping)) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, msg: 'isFreeShipping should be a boolean value' })
            }

            if (!updateproductdata.hasOwnProperty('isFreeShipping'))
                updateproductdata['isFreeShipping'] = isFreeShipping
        }

        //Upload image to AWS server
        let image = req.files;
        if ((image && image.length > 0)) {

            let newupdatedimage = await config.uploadFile(image[0]);

            if (!updateproductdata.hasOwnProperty('productImage'))
                updateproductdata['productImage'] = newupdatedimage
        }

        if (validator.isValid(style)) {

            if (!updateproductdata.hasOwnProperty('style'))
                updateproductdata['style'] = style
        }

        //Valdiation in sizes to input multiple size in a single go
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, msg: "AvailableSizes should be from this ['S','XS','M','X','L','XXL','XL']" })
                }
            }
            if (!updateproductdata.hasOwnProperty(updateproductdata, '$addToSet'))
                updateproductdata['$addToSet'] = {}
            updateproductdata['$addToSet']['availableSizes'] = { $each: sizesArray }
        }

        //Must be a valid number for installments
        if (validator.isValid(installments)) {

            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, msg: `installments should be a valid number` })
            }

            if (!updateproductdata.hasOwnProperty('installments'))
                updateproductdata['installments'] = installments
        }

        const newupdatedProduct = await productModel.findOneAndUpdate({ _id: productid }, updateproductdata, { new: true })

        return res.status(200).send({ status: true, msg: 'Product details updated successfully.', data: newupdatedProduct });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.msg });
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId

                               //validation 
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: `${productId} not exists` })
        }
      

        // finding product for deletion 
        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, msg: `Product not present by ${productId}` })
        }
        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }) //setting time

            return res.status(200).send({ status: true, msg: `product deleted sucessfully.` })
        }
        return res.status(400).send({ status: true, msg: `product deleted earlier` })


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.msg });
    }
}

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct }