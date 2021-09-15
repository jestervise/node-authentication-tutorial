const express = require("express")
require('dotenv').config()
const sessions = require("client-sessions")
const bcrypt = require("bcryptjs");
let app = express();

const mongoose = require("mongoose");
const { render } = require("pug");
const { redirectToDashboardIfLogged, loginRequired } = require("./util/middleware");
mongoose.connect(process.env.db_url)

//create mongodb user schema 
let User = mongoose.model('User',{
    firstName:{type:String, required:true},
    lastName :{type:String, required:true},
    email:{type:String, required:true,unique:true},
    password:{type:String, required:true}
});

app.set("view engine","pug")

app.use(express.urlencoded({extended:true}))
//use session middleware to set cookie for user
app.use(sessions({
    cookieName:"session",
    secret:process.env.session_secret,
    duration:30 * 60 * 1000
}))

//if user has session in the cookie,set user to the current user in the request object 
app.use((req,res,next)=>{
    if(!(req.session && req.session.userId)){
        return next();
    }

    User.findById(req.session.userId,(err,user)=>{
        if(err){
            return next(err)
        }

        if(!user){
            return next();
        }
        user.password = undefined;
        req.user = user;
        res.locals.user = user;
        next();
    })
})

app.get("/",redirectToDashboardIfLogged,(req,res)=>{
    res.render("index");
})

app.get("/register",redirectToDashboardIfLogged,(req,res)=>{
    res.render("register");
})

//hash user password when register and save user email and password to db
app.post("/register",(req,res)=>{
    const hash = bcrypt.hashSync(req.body.password,14)
    req.body.password = hash;
    let user = new User(req.body);
    user.save((err)=>{
        if(err){
            let error ="Unknown error happened!"

            if(err.code == 11000){
                error= "The email has been taken, please try again";
            }
    
            return res.render("register",{error:error})
        }
        res.redirect("login")
    })
   
})

app.get("/login",redirectToDashboardIfLogged,(req,res)=>{
    res.render('login',{error:""})
})

app.post("/login",(req,res)=>{
    User.findOne({email:req.body.email},(err,user)=>{
        console.log("lala",req.body,user,err)

        if(err || !user || !bcrypt.compareSync(req.body.password,user.password)){
            return res.render("login",{error:"Incorrect email / password"});
        }

        req.session.userId = user._id
        res.redirect('dashboard')
    })
    
})



app.get("/dashboard",loginRequired,(req,res,next)=>{
  

    //or get the user id from the encrypted session 
    User.findById(req.session.userId,(err,user) => {
        if(err){
            return next(err);
        }

        if(!user){
            return res.redirect("/login");
        }

        res.render("dashboard");
    })
})

app.get("/logout",(req,res)=>{
    req.session.destroy(null)
    res.clearCookie("session",{path:'/'})
    res.redirect("/")
})

app.listen(7100,()=>{
    console.log("server running on http://localhost:7100");
})