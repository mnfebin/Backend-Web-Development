const express = require('express');
const postRoutes = require('./routes/postRoutes');
const { resetData } = require('./data/postStore');
const controller = require('./controllers/postController');

function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/posts', postRoutes);

  app.get('/demo/internal-error', controller.explode);

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = 3000;

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

module.exports = {
  createApp,
  resetData
};