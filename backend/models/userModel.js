const mongoose= require("mongoose")
const bcrypt=require("bcryptjs");
const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,"please enter a name"],
        unique:true,
        trim:true,
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,"please enter a valid email"]

    
    },
    password:{
        type:String,
        required:[true,"please enter a name"],
        minLength:[6,"password  must be 6 characters"],
        //maxLength:[12,"password  must not me more than 12 characters"],

    },
    photo:{
        type:String,
        required:[true,"please add a photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png"
    },
    phone: {
        type: String,
        default: "+254",
      },
      bio: {
        type: String,
        maxLength: [250, "Bio must not be more than 250 characters"],
        default: "bio",
      },
    },
    {
      timestamps: true,
    }
  );  
  //encrypt passwords
userSchema.pre("save",async function(next){
if (!this.Modified("password")){
  return next();

}

  //hash password
  const salt=await bcrypt.genSalt(10)
  const hashedPassword=await bcrypt.hash( password,salt);
  this.password=hashedPassword
  next();
});
const User=mongoose.model("User",userSchema)
module .exports=User