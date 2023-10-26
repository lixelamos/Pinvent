const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Token=require("../models/tokenModel");
const crypto=require("crypto");
const { Console } = require("console");
const { off } = require("process");
const sendEmail = require("../utils/sendEmail");

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Encrypt password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
        name,
        email,
        password:hashedPassword,
      });
      //send HTTP-only cookie
      res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires:new Date(Date.now()+1000*86400),
        sameSite:"strict",
        secure:true
      });

  // Generate token
  const token = generateToken(user._id);

  if (user) {
    const { _id, name, email, photo, bio, phone } = user;
    res.status(201).json({
      _id: user._id,
      name,
      email,
      photo,
      bio,
      phone,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if the user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // Check if the password is correct
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid password");
  }

  // Generate token
  const token = generateToken(user._id);

  if (user) {
    const { _id, name, email, photo, bio, phone } = user;
    res.status(201).json({
      _id: user._id,
      name,
      email,
      photo,
      bio,
      phone,
      token,
    });
  }
});
//Log out user
const logout= asyncHandler(async(req,res)=>{
    res.cookie("token","",{
        path:"/",
        httpOnly:true,
        expires:new Date(0),
        sameSite:"strict",
        secure:true
      });
      return res.status(200).json({message:"successfully logged out"})
});
//get user data
const getUser=asyncHandler(async(req,res)=>{
    res.send("Get User Data");
});
//get login status
const loginStatus=asyncHandler(async(req,res)=>{

  const token=req.cookies.token;
  if (!token){
    return res.json(false);
  }
  //verify token 2
  const verified=jwt.verify(token,process.env.JWT_SECRET);
  if (verified){
    return res.json(true);
  }
  
    return (false); 
  

});
//update user
const  updateUser=asyncHandler (async(req,res)=>{
const user=await User.findById(req.user._id)
if(user)
{
  const {_id,name,email,photo,phone,bio}=user

  user.email=email;
  user.name=req.body.name||name;
  user.phone=req.body.phone||phone;
  user.bio=req.body.bio||bio;
  user.photo=req.body.photo||photo;

  const updateUser= await user.save()
  res.json({
    _id:updatedUser._id,
    name:updatedUser.name,
    email:updatedUser.email,
    bio:updatedUser.bio,
    phone:updatedUser,
    photo:updatedUser.photo

  })
}
  else {
    res.status(404)
    throw new Error("User not found");
  }
});
//change password
const changePassword=asyncHandler(async(req,res)=>
{
  const user=await User.findById(req.user._id);
  const {oldPassword,password}=req.body
  if (user){
    res.status(400);
    throw new Error("User not found please sign up  ");
  }
  //Validate
  if(!oldPassword|| !password){
    res.status(400);
    throw new Error("Please enter the old password");
  }
  //check if password matches old and new)
  const passwordIsCorrect=await bcrypt.compare(oldPassword,user.password)
  //Save new password
  if (user&& passwordIsCorrect){
    user.password=password
    await user.save()
    res.status(200).json({message:"password changed"})

  }
  else {
    res.status(400)
    throw new error("old password did not match")
  }
});
//forgot password
const forgotPassword=asyncHandler(async(req,res)=>
{
const {email}=req.body
const user=await User.findOne({email});
if(!user ){
  res. status(404);
  throw new Error("User not found");
}
  //Delete token if it exist in Database

  let token=await Token.findOne({userId:user._id})
  if (token){
    await token.deleteOne()
  }

//Create reset token
let resetToken= crypto.randomBytes(32).toString("hex")+user._id

//hash token before saving
 const hashedToken=crypto.createHash("sha256")
 .update(resetToken)
 .digest("hex");
 console.log(hashedToken);
res.send("forgot password");
//save token to the database
await new Token({

  userId:user._id,
  token:hashedToken,
  createdAt:Date.now(),
  expiresAt:Date.now()+30*(60*1000)//30 mins
}).save();



//construct reset URL

const resetUrl=`${process.env.FRONTEND_URL}/
resetpassword/${resetToken}`

//Reset email

const message =`
<h2>Hello ${user.name}</h2>
<p>Please use the URL below to reset your password </p>
<p>This reset link expires in 30 minutes</p>

<a  href=${resetUrl}clicktracking=>off>${resetUrl}</a>
<p>Regards..</p>
<p>Pinvent team</p>`;


const subject="Password Reset Request"
const send_to=user.email
const sent_from=process.env.EMAIL_USER
try{
  await sendEmail(subject,message,send_to)
  res.status(200).json({success:true,message:"Reset Email sent"})

}
  catch{ (error)
    res.status(500)
    throw new Error("Email not sent please try again")
  }

});
//Reset Password
const resetPassword = asyncHandler(async(req,res)=>{
const{password}=req.body
const{resetToken}=req.params
//hash token  then compare token in the database
const hashedToken=crypto.createHash("sha256")
.update(resetToken)
.digest("hex");
//find token in the database
const userToken=await Token.findOne({
  token: hashedToken,
expiresAt:{$gt: Date.now()}


})
if(!userToken){
  res.status(404);
  throw new Error("Invalid Token expired");
}
//find user    
const user=await User.findById({_id:userToken.userId})
user.password
await user.save();
  res.status(200).json({
  message:"Password reset successful please login" 
})

});
module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
