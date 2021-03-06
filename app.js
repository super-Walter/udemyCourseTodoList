const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');
const { ID } = require('./config');
const { KEY } = require('./config');

const app = express();

app.use(express.json());
app.use(express.urlencoded( {extended: true} ));
app.set('view engine', 'ejs');
app.use(express.static('public'));

mongoose.connect(`mongodb+srv://${ID}:${KEY}@cluster0.zvnci.mongodb.net/todolistDB`, { 
  useNewUrlParser:true,
  useUnifiedTopology: true ,
  useFindAndModify: false
});

const itemsSchema = new mongoose.Schema({
  name: String
})
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to Your Todo List.'
});
const item2 = new Item({
  name: 'Press the + button to add a new item.'
});
const item3 = new Item({
  name: '<-- Press this button to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get('/', (req, res) => {

  Item.find({}, (err, result) => {

    if (result.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log('There is en error occured --->', err);
        } else {
          console.log('Inserted To Database Successfully!');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItems: result });
    }

  });

});

app.get('/about', (req, res) => { res.render('about'); });

app.post('/', (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err, result) => {
      result.items.push(item);
      result.save(() => { res.redirect('/' + listName); });
    });
  }


});

app.post('/delete', (req, res) => {

  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {

    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (err) {
        console.log('Error ocurrs --->', err);
      } else {
        console.log('Deleted Successfully!');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: checkedItemID}}}, 
      (err,result) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }

});

app.get('/:customListName', (req, res) => {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, result) => {
    if (!err) {
      if (!result) {

        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(() => res.redirect('/' + customListName));
      } else {
        res.render('list', { listTitle: result.name, newListItems: result.items });
      }
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server has started on port ${process.env.PORT} successfully!`);
});