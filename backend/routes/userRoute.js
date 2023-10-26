const express = require("express");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");

const {registerUser, 
    loginUser,
    logout,
     getUser,
     loginStatus,
     updateUser,
     changePassword,
     forgotPassword,
    resetPassword}=require("../controllers/userController");


router.post("/register",registerUser);
router.post("/Login",loginUser);
router.get("/logout",logout);
router.get("/getUser",protect,getUser);
router.get("/loggedIn",loginStatus);
router.patch("/updateuser",protect,updateUser);
router.patch("/changepassword",protect,changePassword);
router.post("/forgotpassword",forgotPassword);
router.put("/resetpassword/:resetToken",resetPassword);








module.exports= router;