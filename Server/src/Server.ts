import { DatabaseInterface } from "./DatabaseInterface";
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
            getImages(res, params);
            break;
        case '/upload':
            upload(res, params);
            break;
        case '/countdownload':
            res.writeHead(await countdownload(res, params));
            res.end();
            break;
        default:
            pageNotFound(res);
            break;
    }
    
}).listen(PORT);

function getImages(res: ServerResponse<IncomingMessage>, params: object) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('working on that...');
}

function upload(res: ServerResponse<IncomingMessage>, params: object) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('working on that...');
}

async function countdownload(res: ServerResponse<IncomingMessage>, params: object) : Promise<number>{
    if(!('id' in params))
        return 400;

    let id: number;
    try{
        id = Number.parseInt(params['id'] as string);
    }
    catch(e){
        return 400;
    }

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

function pageNotFound(res: ServerResponse<IncomingMessage>){
    res.writeHead(404);
    res.end();
}
