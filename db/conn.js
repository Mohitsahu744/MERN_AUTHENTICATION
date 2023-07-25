const mongoose = require("mongoose")
const DB = "mongodb+srv://sahumohit1437:auth@cluster0.tubhfsu.mongodb.net/Authusers?retryWrites=true&w=majority";

mongoose.connect(DB,{
    // useUnifieldTopology:true,
    useNewUrlParser: true
}).then(()=>
console.log("Database Connected")).catch((error)=>{
console.log(error)
})
