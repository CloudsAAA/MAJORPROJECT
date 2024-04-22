if(process.env.NODE_ENV !="production") {
    require("dotenv").config();
}
const express = require("express");
const app = express(); 
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL ="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("Connected to db");
})
.catch( (err) => {
    console.log(err);
});
async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,       
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(( req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req,res) => {
//     let fakeUser = new User ({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });
//     let resgisteredUser = await User.register(fakeUser, "helloworld");
//     res.send(resgisteredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
 next(new ExpressError(404, "Page Not Found!"));
});

app.use((err,req,res,next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
   // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("Server is listening in port 8080");
});

// const validateListing = (req,res,next) => {
//     let { error } = listingSchema.validate(req.body);   
//    if(error) {  
//     let erMsg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(400, erMsg);
//     } else {
//         next();
//     }
// };

//Index Route------------------

// app.get("/listings", wrapAsync(async (req,res) => {
//     const allListings = await Listing.find({});
//    res.render("listings/index.ejs", { allListings }); 
// }));

// //New Route---------------------
// app.get("/listings/new", wrapAsync((req,res) => {
//     res.render("listings/new.ejs");
// }));

// show Route-------------------
// app.get("/listings/:id", wrapAsync(async (req,res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs", {listing});
// }));

//Create Route---------------------------
// app.post("/listings",validateListing, wrapAsync(async (req,res,next) => {
//     const newListing = new Listing(req.body.listing);
//     await newListing.save();
//     res.redirect("/listings");
//   //  //let {title, description, image, price, country, location} = req.body;
//   //  //let listing = req.body.listing;
//    })
// );

//Edit Route--------------------------
// app.get("/listings/:id/edit",wrapAsync (async (req,res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", {listing});
// }));

//Update Route------------------------
// app.put("/listings/:id",validateListing, wrapAsync(async (req,res) => {
//     let { id } = req.params;
//     await Listing.findByIdAndUpdate(id, { ...req.body.listing });
//     res.redirect(`/listings/${id}`);
// }));

//Delete Route------------------
// app.delete("/listings/:id",wrapAsync( async (req,res) => {
//     let {id} = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
// }));

//Reviews------------------------
//Post Review Route
// app.post("/listings/:id/reviews", validateReview, wrapAsync (async (req,res) => {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//     res.redirect(`/listings/${listing._id}`);

//     // console.log("new review saved");
//     // res.send("new review saved");
//    })
//  );

//Delete Review Route--------------
// app.delete(
//     "/listings/:id/reviews/:reviewId", 
//     wrapAsync (async (req,res) => {
//     let { id, reviewId } = req.params;

//     await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
//     await Review.findByIdAndDelete(reviewId);

//     res.redirect(`/listings/${id}`);
//    })
//  );

// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing ( {
//         title: "My new villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("Successful testing");
//});

