const Listing= require("../models/listings.js");
const axios = require('axios');
module.exports.showListings=async (req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}
module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
}
module.exports.seeListing=async (req,res)=>{
    const {id}= req.params;
    const listing= await Listing.findById(id).populate({path: "reviews", populate : {path :"author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing Doesn't Exists");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
}
module.exports.postTheListing= async (req,res)=>{
   if (!req.file) {
    req.flash("error", "Image upload failed.");
    return res.redirect("/listings/new");
 }
 const location= req.body.listing.location;
  let geojson = {
    type: "Point",
    coordinates: [0, 0] 
  };
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: location,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'TravelPaglu (ashdevasani02@email.com)' 
      }
    });
  const data = response.data[0];
    if (data) {
      geojson = {
        type: "Point",
        coordinates: [parseFloat(data.lon), parseFloat(data.lat)]
      };
    } else {
      return res.send("error");
  } }catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return res.redirect("/listings/new");
  }

    let url= req.file.path;
    let filename= req.file.filename;
    const newListing= new Listing(req.body.listing);
    newListing.owner= req.user._id;
   newListing.image={url,filename};
   newListing.geometry=geojson;
    await newListing.save();
   req.flash("success","New Listing Added");
   res.redirect("/listings");
}
module.exports.editTheListing=async (req,res)=>{
    const {id}= req.params;
    const editListing=req.body.listing;
    const edit=await Listing.findByIdAndUpdate(id,{...editListing});
    if(req.file){
        const url=req.file.path;
        const filename=req.file.filename;
        edit.image={url,filename};
        await edit.save();
    }
    req.flash("success"," Listing Updated");
    res.redirect(`/listings/${id}`);
}
module.exports.renderEditForm=async (req, res)=>{
    let {id}= req.params;
    let listing= await Listing.findById(id);
      if(!listing){
        req.flash("error","Listing Doesn't Exists");
        res.redirect("/listings");
    }
    let originalImageUrl= listing.image.url;
    originalImageUrl=originalImageUrl.replace("/uploads","/uploads/w_250");
    res.render("listings/edit.ejs",{listing , originalImageUrl});
}
module.exports.destroyLisitng=async (req,res)=>{
    let {id}= req.params;
    let deletedChat= await Listing.findByIdAndDelete(id);
    req.flash("success"," Listing Deleted");
    res.redirect("/listings");
}