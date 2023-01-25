
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://chat_reader:Naresh_Chat_Reader@cluster1.mfgsg.mongodb.net/todoListDB?retryWrites=true&w=majority", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify : false
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name : String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name : "Welcome to my todolist"
});

const item2 = new Item({
  name : "Click that + to add items"
});

const defaultItems = [item1,item2];

const day = date.getDay();



app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){
      
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Added Default items");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }

  });

});


app.post("/", function(req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  const addItem = new Item({
    name : item
  });

  if (listName === day) {
    addItem.save();
    res.redirect('/');
  }else {
    List.findOne({name: listName}, function(err, foundList){
      if (!err){
        foundList.items.push(addItem);
        foundList.save();
        res.redirect('/'+listName);
      }
    });      
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;
  
  if (listName === day ){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        res.redirect('/');
      }
    });
  }else {
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}}, function(err) {
      if (!err){
        res.redirect('/'+listName);
      }
    });
  }  
});


app.get("/:customList", function(req, res) {
  const customListName = _.capitalize(req.params.customList);
  if (customListName != "Favicon.ico"){
    List.findOne({name: customListName}, function( err, foundList){
      if (!err){
        if (!foundList){
          const newList = new List({
            name : customListName,
            items : defaultItems
          });
          newList.save();
            res.redirect('/'+customListName); 
        }else {
          if(foundList.items.length === 0){
            List.findOneAndUpdate({name:customListName},{$push: {items : defaultItems }},function(err){
              if(err){
                console.log(err);
              }else{
                res.redirect('/'+customListName); 
              }  
            });   
          }else{
            res.render('list', {listTitle : foundList.name, newListItems : foundList.items});
          }
        }
      }         
    });
  }      
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server has  started Successfully");
});
