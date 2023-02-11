import { DatabaseInterface, ImageData } from "./DatabaseInterface";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from 'querystring';
import { existsSync, mkdirSync, readFile, writeFile } from "fs";

const PORT = 8080;
const IMAGES_FOLDER = './imagefiles';

let db: DatabaseInterface = new DatabaseInterface();

if(!existsSync(IMAGES_FOLDER))
    mkdirSync(IMAGES_FOLDER);

createServer(async function (req, res){
    let splitURL = req.url?.split('?') ?? [];
    let [path, query] = [splitURL[0] ?? '', splitURL[1] ?? ''];
    let params = parse(query);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');

    // serve images
    if(path.startsWith('/imagefiles')){
        readFile('.' + path, (err, data) => {
            res.writeHead(200);
            res.end(data, 'binary');
        });
        return;
    }

    // server api requests
    switch(path){
        case '/images':
            await getImages(res, params);
            break;
        case '/pagecount':
            await pageCount(res);
            break;
        case '/upload':
            await upload(req, res);
            break;
        case '/countdownload':
            res.writeHead(await countdownload(res, params));
            break;
        default:
            res.writeHead(404);
            break;
    }
    res.end();
    
}).listen(PORT);

console.log(`Running at localhost port ${PORT}`);

async function getImages(res: ServerResponse<IncomingMessage>, params: object) {
    let page = parseIntParam(params, 'page'), order = parseStringParam(params, 'order');
    if(!page || !order || !(order in db.orderQueries))
    {
        res.writeHead(400);
        return;
    }

    let images: ImageData[];
    try{
        images = await db.getImages(page, order);
    }
    catch(e){
        res.writeHead(500);
        return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(images));
}

function upload(req: IncomingMessage, res: ServerResponse<IncomingMessage>) : Promise<void> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('end', async () => {
            let image = body.split(',')[1];
            let imagePath = generatePath();
            // save image
            writeFile(imagePath, image, 'base64', async () => {
                try{
                    await db.uploadImage(imagePath);
                }
                catch(e){
                    res.writeHead(500);
                    resolve();
                    return;
                }
                res.writeHead(200);
                resolve();
            });
        });
    });
}

let counter = 0;
const MAX_COUNTER = 1000;
function generatePath() : string{
    let name = (Date.now() * MAX_COUNTER + (counter++ % MAX_COUNTER)).toString(36);
    return `${IMAGES_FOLDER}/${name}.png`;
}

async function countdownload(res: ServerResponse<IncomingMessage>, params: any) : Promise<number>{
    let id = parseIntParam(params, 'id');
    if(!id)
        return 400;

    if(!await db.idExists(id))
        return 400;

    try{
        await db.updateDownloadCount(id);
    }
    catch(e){
        return 500;
    }

    return 200;
}

async function pageCount(res: ServerResponse<IncomingMessage>) {
    let pages: number;
    try{
        pages = await db.getNumberOfPages();
    }
    catch(e){
        res.writeHead(500);
        return;
    }

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({'pages': pages}));
    return;
}

function parseIntParam(params: any, key: string) : number | null {
    if(!(key in params))
        return null;

    try{
        return Number.parseInt(params[key] as string);
    }
    catch(e){
        return null;
    }
}

function parseStringParam(params: any, key: string) : string | null {
    if(!(key in params))
        return null;

    return params[key];
}
