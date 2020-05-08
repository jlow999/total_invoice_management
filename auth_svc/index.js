const express = require("express")

const app = express()

app.use((req, res) => {
  const token = req.get('authorization');
  console.log(`authorization token ${token}`);

  if (token === process.env.TOKEN) {
    res.json({
      ok: true
    })
  } else {
    res.status(401).json({
      ok: false
    })
  }
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`auth_svc listening on ${port}`)
})