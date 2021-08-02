var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'arnabrup', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
//INDEX ROUTE: Display all Campgrounds ---------------------------------------------------------------------------
router.get("/",function(req , res){
    var noMatch;
    if(req.query.search)
    {
        const regex = new RegExp(escapeRegex(req.query.search) , 'gi')
        Campground.find({name : regex}, function(err , allCampgrounds){
            if(err)
        {
            console.log(err);
        }
        else
        {
            if(allCampgrounds.length < 1)
            {
                noMatch = "No Campgrounds match that query, please try again."
            }
            res.render("campgrounds/campgrounds", {campgrounds : allCampgrounds, page: 'campgrounds', noMatch : noMatch});
        }
        });
    }
    else
    {
        Campground.find({}, function(err , allCampgrounds){
            if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("campgrounds/campgrounds", {campgrounds : allCampgrounds, page: 'campgrounds', noMatch : noMatch});
        }
        });
    }
});
//CREATE ROUTE: Add new Campground to DB ------------------------------------------------------------------------
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});
//NEW ROUTE: Displays form to make new Campground ---------------------------------------------------------------
router.get("/new", middleware.isLoggedIn , function(req , res){
    res.render("campgrounds/new");
});
//SHOW ROUTE: Shows more info about one campground --------------------------------------------------------------
router.get("/:id",function(req , res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground)
        {
            req.flash("error" , "Campground not found");
            res.redirect("back");
        }
        else
        {
            res.render("campgrounds/show" , {campground : foundCampground});
        }
    });
});
//EDIT CAMPGROUND ROUTE -----------------------------------------------------------------------------------------
router.get("/:id/edit", middleware.checkCampgroundOwnership ,function(req , res){
    Campground.findById(req.params.id , function(err , foundCampground ){
    res.render("campgrounds/edit" , {campground : foundCampground});
    });
});
//UPDATE CAMPGROUND ROUTE ---------------------------------------------------------------------------------------
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image') ,function(req , res){
    Campground.findById(req.params.id , async function(err, campground){
        if(err)
    {
        req.flash("error", err.message);
        res.redirect("back");
    }
    else
    {
        if(req.file){
            try
            {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                var result = await cloudinary.v2.uploader.upload(req.file.path);
                campground.imageId = result.public_id;
                campground.image = result.secure_url;
            }
            catch(err)
            {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
        campground.name = req.body.campground.name;
        campground.price = req.body.campground.price;
        campground.description = req.body.campground.description;
        campground.save();
        req.flash("success", "Successfully Updated!");
        res.redirect("/campgrounds/" + req.params.id);
    }
    });
});
//DESTROY CAMPGROUND ROUTE --------------------------------------------------------------------------------------
router.delete("/:id", middleware.checkCampgroundOwnership ,function(req , res){
    Campground.findById(req.params.id, async function(err , campground){
        if(err)
        {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try
            {
                await cloudinary.v2.uploader.destroy(campground.imageId);
                campground.remove();
                req.flash("success", "Campground deleted successfully !");
                res.redirect("/campgrounds");
                
            }
        catch(err)
            {
                req.flash("error", err.message);
                return res.redirect("back");
            }
    });
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
module.exports = router ;