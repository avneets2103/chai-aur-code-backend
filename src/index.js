import dotenv from 'dotenv'
import { dbConnect } from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
})

dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server started at ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.log("DB connect error");
    throw error;
});