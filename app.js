require("dotenv").config();
//REQUIRING PACKAGES ------------------------------------------------------------------------------------------
var Campground       =  require("./models/campground");
var Comment          =  require("./models/comment");
var methodOverride   =  require("method-override");
var LocalStrategy    =  require("passport-local");
var flash            =  require("connect-flash");
var User             = require("./models/user");
var bodyParser       =  require("body-parser");
var passport         =  require("passport");
var mongoose         =  require("mongoose");
var seedDB           =  require("./seeds");
var express          =  require("express");
var app              =  express();
//REQUIRING ROUTES --------------------------------------------------------------------------------------------
var campgroundRoutes =  require("./routes/campgrounds");
var commentRoutes    =  require("./routes/comments");
var indexRoutes      =  require("./routes/index");
//------------------------------------------------------------------------------------------------------------
mongoose.connect("mongodb://localhost:27017/yelp_camp", {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useFindAndModify: false
 });
//seedDB(); //seed Database
//USING REQUIRED PACKAGES --------------------------------------------------------------------------------------
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
//PASSPORT CONFIG ---------------------------------------------------------------------------------------------
app.use(require("express-session")({
    secret : "Raze mains are the best",
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req , res , next ){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.use(indexRoutes);
app.use("/campgrounds/:id/comments" , commentRoutes);
app.use("/campgrounds" , campgroundRoutes);


app.listen(3000,function () {
    console.log("Yelp Camp server has started!!!");
});




