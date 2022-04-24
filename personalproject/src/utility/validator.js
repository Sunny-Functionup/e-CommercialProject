const mongoose = require('mongoose')

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; 
};

const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false 
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
};
const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//only check empty string value.
const validString = function(value) {
        if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
        return true;
    }
    const isValidId = function (value) {
        if (typeof value == 'undefined' || value == null) return false
        if (value.trim().length == 0) return false
        return true
    }
    const validInstallment = function isInteger(value) {
        if (value < 0) return false
        
        if (value % 1 == 0) return true;
    }
    const validquantity = function isInteger(value) {
            if (value < 1) return false
            if (isNaN(Number(value))) return false
            if (value % 1 == 0) return true
    }
    const isValidNumber = function (value) {
        if (typeof value === 'undefined' || value === null) return false
        if (isNaN(value) && value.toString().trim().length !== 0) return false
    
        return true;
    }
    
    
    
    module.exports = { isValid,isValidObjectId,isValidId,isValidRequestBody,validString,validInstallment,validquantity,isValidNumber}