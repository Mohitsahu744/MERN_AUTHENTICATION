const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const keysecret = "kuqwertyfgbhsdmktglshyonvfjypsgy"
const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    conpassword: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    verifytoken:{
        type:String
    }
}) 

// hash password
userSchema.pre("save", async function(next){

    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 12)
        this.conpassword = await bcrypt.hash(this.conpassword, 12)
    }

    next();
})

// token generate
userSchema.methods.generateAuthtoken = async function(){
    try {
        let token23 = jwt.sign({_id:this._id},keysecret,{
            expiresIn:"1d"
        });
        this.tokens = this.tokens.concat({token:token23});
        await this.save();
        return token23;
    } catch (error) {
        resizeBy.status(422).json(error);
    }
}
// creating model
const userdb = new mongoose.model("users", userSchema);

module.exports = userdb;