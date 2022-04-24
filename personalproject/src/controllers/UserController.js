const userModel = require('../models/userModel')
const config = require('../utility/awsconfig')
const validator = require('../utility/validator')
const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const saltRounds = 10

const registerUser = async function (req, res) {
    try {

        let files = req.files
        let userbody = req.body

        let { fname, lname, email, profileImage, phone, password, address } = userbody

        if (!validator.isValidRequestBody(userbody)) {
            return res.status(400).send({ status: false, msg: 'Please provide valid request body' })
        }
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "email is required" })
        }
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
            return res.status(400).send({ status: false, message: "Invalid Email,please provide valid email address " })

        const emailAlreadyUsed = await userModel.findOne({ email })
        if (emailAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${email} is registered. Please try another email address.` })
        }

        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is required' })
        }
        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)))
            return res.status(400).send({ status: false, message: "Phone number must be a Indian number." })

        if (!validator.isValidRequestBody(files)) {
            return res.status(400).send({ status: false, message: "Profile Image needed" })
        }

        const phoneAlreadyUsed = await userModel.findOne({ phone })
        if (phoneAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${phone} is already in use, Please try a new phone number` })
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: 'password is required' })
        }
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: 'Password length should be 8 to 15 characters' })
        }
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: 'Address is required' })
        }


        if (address.shipping.street) {
            if (!validator.isValidRequestBody(address.shipping.street)) {
                return res.status(400).send({ status: false, message: `Shipping address's Street Required` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Shipping address's street should be present` })
        }

        if (address.shipping.city) {
            if (!validator.isValidRequestBody(address.shipping.city)) {
                return res.status(400).send({ status: false, message: 'Shipping address city Required' })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Shipping address's city should be present` })
        }

        if (address.shipping.pincode) {
            if (!validator.isValidRequestBody(address.shipping.pincode)) {
                return res.status(400).send({ status: false, message: `Shipping address's pincode Required` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Shipping address's pincode should be present` })
        }

        if (address.billing.street) {
            if (!validator.isValidRequestBody(address.billing.street)) {
                return res.status(400).send({ status: false, message: `Billing address's Street Required` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Billing address's street should be present` })
        }
        if (address.billing.city) {
            if (!validator.isValidRequestBody(address.billing.city)) {
                return res.status(400).send({ status: false, message: `Billing address's city Required` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Billing address's city should be present` })
        }
        if (address.billing.pincode) {
            if (!validator.isValidRequestBody(address.billing.pincode)) {
                return res.status(400).send({ status: false, message: `Billing address's pincode Required` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: `Billing address's pincode should be present` })
        }

        profileImage = await config.uploadFile(files[0]); //uploading image
        const encryptPassword = await bcrypt.hash(password, saltRounds) //encrypting password by bcrypt

        //on destructuring for response body purpose only
        let userData = { fname, lname, email, profileImage, phone, password: encryptPassword, address }

        const savedUserData = await userModel.create(userData);
        return res.status(201).send({ status: true, message: "user successfully created.", data: savedUserData });

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////

const userLogin = async function (req, res) {
    try {

        const loginBody = req.body
        const { email, password } = loginBody

        if (!validator.isValidRequestBody(loginBody)) {
            return res.status(400).send({ status: false, message: 'Please provide login details' })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email Id is required' })
        }
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: 'Password length should be 8 to 15 characters' })
        }
        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password.trim()))) {
            return res.status(400).send({ status: false, message: 'please provide atleast one uppercase letter ,one lowercase, one character and one number' })
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).send({ status: false, message: 'Email id is incorrect' });
        }

        let bcryptPassword = user.password
        const encryptPassword = await bcrypt.compare(password, bcryptPassword)

        if (!encryptPassword) return res.status(401).send({ status: false, message: 'Password is incorrect' })


        const userId = user._id
        const token = await jwt.sign({
            userId: userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 1 * 60 * 60
        }, 'Products-Management')

        return res.status(200).send({ status: true, message: 'user login successfull', data: { userId, token } })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid userId in params' })
        }

        const finduserProfile = await userModel.findOne({ _id: userId })
        if (!finduserProfile) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId}` })
        }
        if (tokenUserId != finduserProfile._id.toString()) {
            return res.status(403).send({ status: false, message: 'Unauthorized access,user data not matching' })
        }

        return res.status(200).send({ status: true, message: 'Profile successfully found', data: finduserProfile })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateProfile = async function (req, res) {
    try {
        let updateBody = req.body
        let userId = req.params.userId
        let tokenUserId = req.userId
        let files = req.files

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is not a valid userId` })
        }

        if (!validator.isValidObjectId(tokenUserId)) {
            return res.status(400).send({ status: false, message: 'authorization access denied' })
        }

        if (files) {
            if (Object.keys(files).length != 0) {
                const updateProfileImage = await config.uploadFile(files[0]);
                updateBody.profileImage = updateProfileImage;
            }
        }

        if (!validator.isValidRequestBody(updateBody)) {
            return res.status(400).send({ status: false, message: 'Please, provide some data to update' })
        }

        const userProfile = await userModel.findOne({ _id: userId })
        if (!userProfile) {
            return res.status(400).send({ status: false, message: `User doesn't exists by ${userId} this userid` })
        }

        if (userProfile._id != tokenUserId) {
            return res.status(401).send({ status: false, message: 'Unauthorized access,permission denied' })
        }

        let { fname, lname, email, phone, password, address, profileImage } = updateBody

        if (!validator.validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }

        if (!validator.validString(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }

        if (!validator.validString(email)) {
            return res.status(400).send({ status: false, message: 'email is Required' })
        }

        if (email) {
            if (!validator.isValid(email)) {
                return res.status(400).send({ status: false, message: 'Please provide email' })
            }
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
                return res.status(400).send({ status: false, message: "Invalid Email,please provide valid email address " })

            let emailAlreadyPresent = await userModel.findOne({ email: email })
            if (emailAlreadyPresent) {
                return res.status(400).send({ status: false, message: `${email} is already registered` });
            }
        }

        if (!validator.validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is Required' })
        }

        if (phone) {
            if (!validator.isValid(phone)) {
                return res.status(400).send({ status: false, message: 'Please provide Phone number' })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: 'Please enter a valid Indian phone number' });
            }
            let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })
            if (isPhoneAlredyPresent) {
                return res.status(400).send({ status: false, message: `${phone} is already registered` });
            }
        }

        if (!validator.validString(password)) {
            return res.status(400).send({ status: false, message: 'password is Required' })
        }
        if (!validator.validString(profileImage)) {
            return res.status(400).send({ status: false, message: 'profileImage is Required' })
        }

        let tempPassword = password
        if (tempPassword) {
            if (!validator.isValid(tempPassword)) {
                return res.status(400).send({ status: false, message: 'Please provide password' })
            }
            if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(tempPassword.trim()))) {
                return res.status(400).send({ status: false, message: 'please provide atleast one uppercase letter ,one lowercase, one character and one number' })
            }
            var encryptedPassword = await bcrypt.hash(tempPassword, 10)
        }

        let parseBody = JSON.parse(JSON.stringify(updateBody))
        //console.log(parseBody)
        if (parseBody.address == 0) {
            return res.status(400).send({ status: false, message: 'Please add shipping or billing address to update' })
        }
        if (address) {
            let jsonAddress = JSON.parse(JSON.stringify(address))
            if (!(Object.keys(jsonAddress).includes('shipping') || Object.keys(jsonAddress).includes('billing'))) {
                return res.status(400).send({ status: false, message: 'Please add shipping or billing address to update' })
            }

            let { shipping, billing } = parseBody.address
            if (shipping == 0) {
                return res.status(400).send({ status: false, message: 'Please add street, city or pincode to update for shipping' })
            }
            if (shipping) {
                if (!(Object.keys(shipping).includes('street') || Object.keys(shipping).includes('city') || Object.keys(shipping).includes('pincode'))) {
                    return res.status(400).send({ status: false, message: 'Please add street, city or pincode for shipping to update' })
                }

                if (shipping.street == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's Street` })
                }

                if (shipping.city == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's city` })
                }
                if (shipping.pincode == 0) {
                    return res.status(400).send({ status: false, message: `Please provide shipping address's pincode` })
                }
                if (shipping.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(shipping.pincode))) {
                        return res.status(400).send({ status: false, message: 'Pleasee provide a valid pincode of 6 digit' })
                    }
                }
                var shippingStreet = shipping.street
                var shippingCity = shipping.city
                var shippingPincode = shipping.pincode
            }

            if (billing == 0) {
                return res.status(400).send({ status: false, message: 'Please add street, city or pincode to update for billing' })
            }
            if (billing) {
                if (!(Object.keys(billing).includes('street') || Object.keys(billing).includes('city') || Object.keys(billing).includes('pincode'))) {
                    return res.status(400).send({ status: false, message: 'Please add street, city or pincode for billing to update' })
                }

                if (billing.street == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's Street` })
                }
                if (billing.city == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's city` })
                }
                if (billing.pincode == 0) {
                    return res.status(400).send({ status: false, message: `Please provide billing address's pincode` })
                }
                if (billing.pincode) {
                    if (!(/^[1-9][0-9]{5}$/.test(billing.pincode))) {
                        return res.status(400).send({ status: false, message: 'Pleasee provide a valid pincode to update' })
                    }
                }
                var billingStreet = billing.street
                var billingCity = billing.city
                var billingPincode = billing.pincode
            }
        }

        let updateUserProfile = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                fname: fname,
                lname: lname,
                email: email,
                profileImage: updateBody.profileImage,
                phone: phone,
                password: encryptedPassword,
                'address.shipping.street': shippingStreet,
                'address.shipping.city': shippingCity,
                'address.shipping.pincode': shippingPincode,
                'address.billing.street': billingStreet,
                'address.billing.city': billingCity,
                'address.billing.pincode': billingPincode
            }
        }, { new: true })

        return res.status(200).send({ status: true, data: updateUserProfile })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { registerUser, userLogin, getUserProfile, updateProfile }