const express = require('express');
const app = express();
const port = process.env.PORT || 5000;


app.get('/', (req, res) => {
    res.send('valo kore study koro')
  })
  
  app.listen(port, () => {
    console.log(`group study is running on port: ${port}`)
  })