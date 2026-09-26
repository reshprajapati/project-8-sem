require('dotenv').config();
const App = require('./App');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const app = await new App().init();
    app.listen(PORT);
  } catch (err) {
    console.error('❌ Server initialization failed:', err);
    process.exit(1);
  }
})();
