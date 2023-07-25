const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema")
const bcrypt = require('bcryptjs')
const authenticate = require("../middleware/authenticate")
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const keysecret = "kuqwertyfgbhsdmktglshyonvfjypsgy"

//email config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "sahumohit1437@gmail.com",
        pass: "kijfywuaiklkngkn"
    }
})



// for user registration
router.post("/register", async (req, res) => {
    const { fname, email, password, conpassword } = req.body;

    if (!fname || !email || !password || !conpassword) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
        const preuser = await userdb.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "This Email is Already Exist" })
        } else if (password !== conpassword) {
            res.status(422).json({ error: "Password and Confirm Password Not Match" })
        } else {
            const finalUser = new userdb({
                fname, email, password, conpassword
            })

            // save data to database
            const storeData = await finalUser.save();
            // console.log(storeData);
            res.status(201).json({ status: 201, storeData });
        }
    } catch (error) {
        res.status(422).json(error);
        // console.log("catch block error")
    }
});


// for user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(422).json({ error: "fill all the details" });
    }

    try {
        const userValid = await userdb.findOne({ email: email });

        if (userValid) {
            const isMatch = await bcrypt.compare(password, userValid.password);

            if (!isMatch) {
                res.status(422).json({ error: "Invalid details" });
            } else {

                // token generate
                const token = await userValid.generateAuthtoken();

                // cookiegenerate
                res.cookie("usercookie", token, {
                    //after 15 minutes
                    expires: new Date(Date.now() + 9000000),
                    httpOnly: true
                });
                const result = {
                    userValid,
                    token
                }
                res.status(201).json({ status: 201, result })
            }
        }
    } catch (error) {
        res.status(422).json(error);
        console.log("catch block error")
    }
})


// user valid
router.get("/validuser", authenticate, async (req, res) => {
    try {
        const ValidUserOne = await userdb.findOne({ _id: req.userId });
        res.status(201).json({ status: 201, ValidUserOne })
    } catch (error) {
        res.status(401).json({ status: 401, error });

    }
})

// user logout
router.get("/logout", authenticate, async (req, res) => {

    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });

        res.clearCookie("usercookie", { path: "/" });

        // req.rootUser.save();
        res.status(201).json({ status: 201, message: "logout" })

    } catch (error) {
        res.status(401).json({ status: 401, error })
    }
})

//Forgot password generate link

router.post("/sendpasswordlink", async (req, res) => {
    // console.log(req.body,"done")
    const { email } = req.body;
    if (!email) {
        res.status(401).json({ status: 401, message: "Enter Your Email" })
    }
    try {
        const userfind = await userdb.findOne({ email: email });

        // token generate for reset password
        const token = jwt.sign({ _id: userfind._id }, keysecret, {
            expiresIn: "600s"
        });

        const setusertoken = await userdb.findByIdAndUpdate({ _id: userfind._id }, { verifytoken: token }, { new: true });
        // console.log(setusertoken)

        if (setusertoken) {
            const mailOptions = {
                from: "sahumohit1437@gmail.com",
                to: email,
                subject: "Sending Email for password reset",
                text: `This Link Valid For 10 MINUTES https://mernauthenticationjwttoken.netlify.app/forgotpassword/${userfind.id}/${setusertoken.verifytoken}`
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("error", error);
                    res.status(401).json({ status: 401, message: "email not send" })
                } else {
                    console.log("email sent", info.response);
                    res.status(201).json({ status: 201, message: "Email sent successfully" })
                }
            })
        }
    } catch (error) {
        res.status(401).json({ status: 401, message: "Invalid user" })
    }
})


//verify user for forgot password time
router.get("/forgotpassword/:id/:token",async(req,res)=>{
    const {id,token} = req.params;

    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        console.log(verifyToken)

        if(validuser && verifyToken._id){
            res.status(201).json({status:201,validuser})
        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }

    } catch (error) {
        res.status(401).json({status:401,error})
    }
});


// change password

router.post("/:id/:token",async(req,res)=>{
    const {id,token} = req.params;

    const {password} = req.body;

    try {
        const validuser = await userdb.findOne({_id:id,verifytoken:token});
        
        const verifyToken = jwt.verify(token,keysecret);

        if(validuser && verifyToken._id){
            const newpassword = await bcrypt.hash(password,12);

            const setnewuserpass = await userdb.findByIdAndUpdate({_id:id},{password:newpassword});

            setnewuserpass.save();
            res.status(201).json({status:201,setnewuserpass})

        }else{
            res.status(401).json({status:401,message:"user not exist"})
        }
    } catch (error) {
        res.status(401).json({status:401,error})
    }
})

module.exports = router;
