import { DatabaseInterface, ImageData } from "./DatabaseInterface";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from 'querystring';

const PORT = 8080;

let db: DatabaseInterface = new DatabaseInterface();

/*(async function main() {
    await db.uploadImage('newImage');
    console.log(await db.getImages(1, 'popular'));
})();*/

createServer(async function (req, res){
    let splitURL = req.url?.split('?') ?? [];
    let [path, query] = [splitURL[0] ?? '', splitURL[1] ?? ''];
    let params = parse(query);
    switch(path){
        case '/getImages':
            await getImages(res, params);
            break;
        case '/upload':
            await upload(res, params);
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

async function upload(res: ServerResponse<IncomingMessage>, params: any) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('working on that...');
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
