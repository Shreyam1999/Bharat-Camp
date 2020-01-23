
var express    =require("express"),
    app        =express(),
    bodyParser =require("body-parser"),
    mongoose   =require("mongoose"),
    flash      =require("connect-flash"),
    passport   =require("passport"),
   LocalStrategy =require("passport-local"),
   methodOverride=require("method-override"),
    Campground =require("./models/campground"),
    Comment    =require("./models/comment"),
    User       =require("./models/user"),
    middleware =require("./middleware");

//mongoose.connect("mongodb://localhost/My_camp",{useNewUrlParser: true});
mongoose.connect("mongodb+srv://Shreyam:Shreyam1999@cluster0-edjqd.mongodb.net/test?retryWrites=true&w=majority");
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());

/**************PASSPORT CONFIGURATION***********************/
app.use(require("express-session")({
   secret:"Shreyam is the best developer!",
   resave:false,
   saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware so that user id and username is associated automatically
app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  res.locals.error=req.flash("error");
  res.locals.success=req.flash("success");
  next();
});

/**************************************************************************************/

//ROUTES SETTING FOR BHARAT CAMP WEBSITE

/****************************************************************************************/


//ROOT Route-Homepage of website
app.get("/",function(req,res){
    res.render("landing");
});


//INDEX Route -show all campgrounds
app.get("/campgrounds",function(req,res){
	//Get all campgrounds from DB
    Campground.find({},function(err,allCampgrounds){
    	if(err){
    		console.log(err);
    	}
    	else{
    		//send or rendering the whole data to campgrounds page via variable 'campgrounds = allCampgrounds'  
           res.render("campgrounds/index",{campgrounds:allCampgrounds});
    	}
    });
});

//CREATE Route-add new campground to database
app.post("/campgrounds",middleware.isLoggedIn,function(req,res){
	//Get a new Campground data from form page 
	var name=req.body.name;
  var price=req.body.price;
	var image=req.body.image;
	var desc=req.body.description;
  var author={
    id:req.user._id,
    username:req.user.username
  }
	var newCampground={name:name,price:price,image:image,description:desc,author:author}

	// save the new Campground data to database
      Campground.create(newCampground,function(err,newlyCreated){
      	if(err){
      		console.log(err);
      	}else{
            //redirect to campground image
	        res.redirect("/campgrounds");
      	}
      });
});


//NEW Route-show form to create a campground
app.get("/campgrounds/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});


//SHOW Route-show info about one campground
app.get("/campgrounds/:id",function(req,res){
	//find the campground with provided ID
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if(err){
	 		console.log(err);
		}else{
            //render show template with that campground
	        res.render("campgrounds/show",{campground:foundCampground});
		}
	});
});

//EDIT CAMPGROUND ROUTE- edit campground by its associated user only
app.get("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
     res.render("campgrounds/edit",{campground:foundCampground});
    });
  });

//UPDATE CAMPGROUND ROUTE- update campground data to database
app.put("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
  //find and update the correct campground
  Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
    if(err){
      res.redirect("/campgrounds");
    }else{
      res.redirect("/campgrounds/"+req.params.id);
    }
  });
});

//DESTROY ROUTE-delete campground
app.delete("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
  Campground.findByIdAndRemove(req.params.id,function(err){
    if(err){
      res.redirect("/campgrounds");
    }else{
      res.redirect("/campgrounds");
    }
  });
});

/******************************************************************************************/
//COMMENT ROUTES

/****************************************************************************************************/

app.get("/campgrounds/:id/comments/new",middleware.isLoggedIn,function(req,res){
	//find campground by id
    Campground.findById(req.params.id,function(err,campground){
    	if(err){
    		console.log(err);
    	}else{
    		res.render("comments/new",{campground:campground});
    	}
    });
});
//lookup campground using ID
	//create new comment
	//connect new comment to campground
	 //redirect campground show page
app.post("/campgrounds/:id/comments",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
    	if(err){
    		console.log(err);
    		res.redirect("/campgrounds");
    	}else{
    		Comment.create(req.body.comment,function(err,comment){
      	if(err){

      		console.log(err);
      	}else{
             //add username and id to comment
             comment.author.id=req.user._id;
             comment.author.username=req.user.username;
             //save comment
             comment.save();
            campground.comments.push(comment);
            campground.save();
            req.flash("success","Successfully added comment!");
	        res.redirect('/campgrounds/'+ campground._id);
      	}
      });
    	}
    });
});

//EDIT ROUTE-edit comments 
app.get("/campgrounds/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
   Comment.findById(req.params.comment_id,function(err,foundComment){
    if(err){
      res.redirect("back");
    }else{
      res.render("comments/edit",{campground_id:req.params.id,comment:foundComment});
    }
   });
});


//UPDATE COMMENT ROUTE- update comment data to database
app.put("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
  //find and update the correct comment
  Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
    if(err){
      res.redirect("back");
    }else{
      res.redirect("/campgrounds/"+req.params.id);
    }
  });
});

//DESTROY ROUTE-delete comment
app.delete("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
  Comment.findByIdAndRemove(req.params.comment_id,function(err){
    if(err){
      res.redirect("back");
    }else{
      req.flash("success","Comment deleted!");
      res.redirect("/campgrounds/"+req.params.id);
    }
  });
});


/***************************************************************/	

//AUTH ROUTES

/***************************************************************************/

app.get("/register",function(req,res){
  res.render("register");
});

//Handle Sign up 
app.post("/register",function(req,res){
  var newUser=new User({username:req.body.username});
  User.register(newUser,req.body.password,function(err,user){
    if(err){
      req.flash("error",err.message);
      return res.render("register");
    }
      passport.authenticate("local")(req,res,function(){
        req.flash("success","Welcome to Bharat Camp "+ user.username);
        res.redirect("/campgrounds");
      });
   });   
});


//Login Routes
app.get("/login",function(req,res){
  res.render("login");
});
//middleware passport.authenticate
app.post("/login",  passport.authenticate("local",
  {
    successRedirect:"/campgrounds",
   failureRedirect:"/login"
  }),  function(req,res){
   
});


//Logout Routes
app.get("/logout",function(req,res){
  req.logout();
  req.flash("success","Logged you out!");
  res.redirect("/campgrounds");
});


/********************************************************************************************/
// LISTENER ROUTES
/*********************************************************************************************************/

//Listener
const PORT = process.env.PORT || 1500;
app.listen(PORT,function(){
	console.log("The Camping Site Server has started");
});