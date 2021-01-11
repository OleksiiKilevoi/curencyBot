const express = require('express');
const mongoose = require('mongoose');
const db = mongoose.connect('mongodb://localhost/clientAPI');

const Client = require('./models/clientModel');
var app = express();
const clientRouter = express.Router();
var port = 3000
app.use(express.urlencoded());
app.use(express.json());

clientRouter.route('/clients')
  .post((req, res) => {
    const client = new Client(req.body);

    console.log(client)
    client.save();
   return res.json(client);
  })
  .get((req, res) => {
    Client.find( (err, clients) => {
      if (err) {
       return  res.send(err);
      }
      return   res.json(clients);
    });
  });

app.use('/api', clientRouter);

app.get('/', (req, res) =>{
  res.send('information')
});

app.listen(port, ()=>{
  console.log('PORT' + port)
});




