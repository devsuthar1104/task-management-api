const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
