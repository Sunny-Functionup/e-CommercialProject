const UserModel = require("../models/userModel");
const jwt = require("jsonwebtoken")

const validator = require("validator");

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
const isValidReqBody = function (data) {
  return Object.keys(data).length > 0;
};


let createUser = async function (req, res) {
  try {
    let data = req.body;

    if (!isValidReqBody(data)) {
      res.status(400).send({ status: false, message: "Please provide User details" })
      return
  }

  if (!isValid(data.title)) {
    res.status(400).send({ status: false, message: "Title is required" })
    return
}

if (!isValid(data.name)) {
  res.status(400).send({ status: false, message: "Name is required" })
  return
}
if (!isValid(data.phone)) {
  res.status(400).send({ status: false, message: "Phone no. is required" })
  return
}

if (!isValid(data.email)) {
  res.status(400).send({ status: false, message: "Email is required" })
  return
}

if (!isValid(data.password)) {
  res.status(400).send({ status: false, message: "password is required" })
  return
}


if (!(validator.isEmail(data.email))) {
  return res.status(400).send({ status: false, message: "Plz enter valid email"})
}

if (!(/^(\+\d{1,3}[- ]?)?\d{10}$/.test(data.phone))) {
  res.status(400).send({ status: false, message: "Plz enter valid phone number" })
  return
}

if (!(/^(?=.*\d)(?=(.*\W){1})(?=.*[a-zA-Z])(?!.*\s).{8,15}$/.test(data.password))) {
  res.status(400).send({ status: false, message: "Plz enter valid password" })
  return
}

if((data.title)!=("Mr"|| "Mrs" || "Miss")){
    return res.status(400).send({status:false, message:"Plz enter vaild Title"})
}

let isEmailPresent = await UserModel.findOne({email:data.email})
if(isEmailPresent){
return   res.status(400).send({status:false,message:`${data.email}, This Email is already exist`})
}

let isPhonePresent = await UserModel.findOne({phone:data.phone})
if(isPhonePresent){
return   res.status(400).send({status:false,message:`${data.phone}, This Phone is already exist`})
}


    let userCreated = await UserModel.create(data);
    res.status(201).send({ status: true, message: 'Success', data: userCreated});

  } catch (err) {
    res.status(500).send({ status:false, message: err.message });
  }
};


const loginUser = async function (req, res) {
  try{
    let data = req.body;


    if (!isValid(data.email)) {
      res.status(400).send({ status: false, message: "Email is required" })
      return
    }
    
    if (!isValid(data.password)) {
      res.status(400).send({ status: false, message: "password is required" })
      return
    }

  let isEmailPresent = await UserModel.findOne({email:data.email});
  if (!isEmailPresent)
    return res.status(404).send({
      status: false,
      message: `No user found with this Email, ${data.email}`,
    });

  let isPasswordPresent = await UserModel.findOne({password:data.password});
  if (!isPasswordPresent)
    return res.status(400).send({status: false, message: "Password is not correct, plz provide Correct Password",
    });


  let token = jwt.sign(
    {
      userId: isEmailPresent._id.toString(),
      
    },
    "books-management",
    {expiresIn:"30m"})
    
  res.status(201).send({ status: true, message: 'Success', data: token });
  }
  catch(err){
    res.status(500).send({message: "Error", error: err.message})
  }
};

module.exports={createUser, loginUser }