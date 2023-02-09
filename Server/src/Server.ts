// const {DatabaseInterface} = require('./DatabaseInterface');
import { DatabaseInterface } from "./DatabaseInterface"

let db: DatabaseInterface = new DatabaseInterface();

(async function main() {
    await db.uploadImage('newImage');
    console.log(await db.getImages(1, 'popular'));
})();