import app from "./src/app.js";
import appConfig from "./src/config/appConfig.js";
import connectDB from "./src/config/db.js";


connectDB()



app.listen(appConfig.port, (req, res) => {
    console.log(`Server is running on port ${appConfig.port}`)
})