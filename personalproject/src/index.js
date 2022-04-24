const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const multer = require('multer')
const route = require('./routes/route.js')
const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(multer().any())


mongoose.connect("mongodb+srv://Parth1111:a5xZnL6DVS-c-!7@cluster0.9doof.mongodb.net/Project-five?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected...."))
.catch ( err => console.log(err) )

app.use('/',route)

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
})