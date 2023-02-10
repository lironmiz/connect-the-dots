const SERVER = 'http://localhost:8080';

const inputCanvas = document.getElementById("inputCanvas");
const dropZone = document.querySelector(".drop-zone");
const APIButton = document.getElementById("btn-api");
const inputContext = inputCanvas.getContext("2d", { willReadFrequently: true });

let imageData;

let loadingElement = document.getElementById("loading");

const btnUpload = document.getElementById("btn-upload");
const btnDownload = document.getElementById("btn-download");
const btnPrint = document.getElementById("btn-print");
const outputCanvas = document.getElementById("outputCanvas");
const outputContext = outputCanvas.getContext("2d");

const btnProcessing = document.getElementById("btn-processing");
const ProcessingStages = [];

let colorMap;
let mapWidth, mapHeight;

let removeBackgroundOn = false;
let reprocess = false;
let backgroundChanged = false;
inputCanvas.addEventListener("mousedown", (e) => {
    removeBackgroundImageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height, {colorSpace: 'srgb'});
    removeBackgroundOn = true;
});
inputCanvas.addEventListener("mouseup", (e) => {
    removeBackgroundOn = false;
});
inputCanvas.addEventListener("mousemove", (e) => {
    if(removeBackgroundOn)
        removeBackground(e);
});
let removeBackgroundImageData;
function removeBackground(e){
    reprocess = backgroundChanged = true;
    let rect = inputCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * inputCanvas.width);
    const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * inputCanvas.height);
    // make transparent
    visitMap = flood(colorMap, outputCanvas.width, outputCanvas.height, x, y);
    for(let i = 0; i < visitMap.length; i++){
        if(visitMap[i]){
            removeBackgroundImageData.data[4 * i + 3] = 0;
        }
    }
}

setInterval(() => {
    if(backgroundChanged){
        inputContext.putImageData(removeBackgroundImageData, 0, 0);
    }
    backgroundChanged = false;
}, 120);

setInterval(() => {
    if(reprocess){
        let data = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height, {colorSpace: 'srgb'});
        convertProcess(data, outputCanvas, false);
    }
    reprocess = false;
}, 2000);

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    const reader = new FileReader();

    reader.addEventListener("load", async () => {
        let url = reader.result;
        await loadImageURLToCanvas(url, inputCanvas);
        convert(inputCanvas, outputCanvas);
    });

    reader.readAsDataURL(file);
});

document.getElementById("btn-print").addEventListener("click", function () {
    let printWindow = window.open();
    printWindow.document.write(`<br><img src = '${outputCanvas.toDataURL()}' onload="imageload()"/>`);
    const imageload = () => { window.print(); window.close(); }
    printWindow.document.write(`<script>const imageload = ${imageload}</script>`);    
});

btnDownload.addEventListener("click", () => {
    let link = document.createElement('a');
    link.download = 'image.png';
    link.href = outputCanvas.toDataURL()
    link.click();
});

btnUpload.addEventListener("click", async () => {
    try{
        await fetch(
            `${SERVER}/upload`,
            {
                method: 'post',
                body: outputCanvas.toDataURL()
            }
        );
    }
    catch(e){
        btnUpload.disabled = true;
    }
});

const WIDTH = 640;
function convert(fromCanvas, toCanvas){
    toCanvas.getContext("2d").clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    toCanvas.width = fromCanvas.width;
    toCanvas.height = fromCanvas.height;
    
    imageData = fromCanvas.getContext('2d').getImageData(0, 0, fromCanvas.width, fromCanvas.height, {colorSpace: 'srgb'});
    tempData = fromCanvas.getContext('2d').getImageData(0, 0, fromCanvas.width, fromCanvas.height, {colorSpace: 'srgb'});
    
    convertProcess(tempData, toCanvas);
}

function convertProcess(imgData, toCanvas, generateColorMap=true){
    let context = toCanvas.getContext('2d');
    if(generateColorMap){
        let colorMapCanvas = new OffscreenCanvas(toCanvas.width, toCanvas.height);
        let colorMapContext = colorMapCanvas.getContext("2d");
        colorMapContext.putImageData(imgData, 0, 0);
        let data = colorMapContext.getImageData(0, 0, colorMapCanvas.width, colorMapCanvas.height, {colorSpace: "srgb"});
        colorMap = processColorMap(data);
    }
    
    let pathData = processImage(imgData);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, toCanvas.width, toCanvas.height);
    
    let tempCanvas = new OffscreenCanvas(toCanvas.width, toCanvas.height);
    let tempContext = tempCanvas.getContext('2d');
    tempContext.putImageData(imgData, 0, 0);
    context.drawImage(tempCanvas, 0, 0);

    context.fillStyle = '#000';
    drawPath(pathData, toCanvas);

    toCanvas.hidden = false;
    btnUpload.disabled = false;
    btnDownload.disabled = false;
    btnPrint.disabled = false;
}

APIButton.addEventListener("click", async () => {
    inputContext.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    let response = await fetch("https://dog.ceo/api/breeds/image/random");
    let data = await response.json();
    let url = data.message;
    await loadImageURLToCanvas(url, inputCanvas);
    convert(inputCanvas, outputCanvas);
});

function copyCanvas(fromCanvas, toCanvas){
    toCanvas.width = fromCanvas.width;
    toCanvas.height = fromCanvas.height;
    toCanvas.getContext("2d").drawImage(fromCanvas, 0, 0, toCanvas.width, toCanvas.height);
    toCanvas.hidden = false;
}

async function loadImageURLToCanvas(imageURL, canvas){
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageURL;
        image.setAttribute('crossOrigin', '');
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.hidden = false;
            resolve();
        };
    });
}

function drawPath(pathData, toCanvas){
    let ctx = toCanvas.getContext("2d");
    let [outline, path] = pathData;
    if(path.length === 0)
        return;

    // delete details near outline
    ctx.beginPath();
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#fff';
    ctx.moveTo(...outline[0]);
    for(let i = 1; i < outline.length; i++){
        ctx.lineTo(...outline[i]);
    }
    ctx.stroke();

    // draw path
    ctx.lineWidth = 2;

    ctx.strokeStyle = '#000';
    ctx.font = '12px Arial';
    for(let i = 0; i < path.length - 1; i++){
        ctx.fillText(i + 1, path[i][0] + 4, path[i][1]);
        ctx.beginPath();
        ctx.arc(path[i][0], path[i][1], 3, 0, 360);
        ctx.stroke();
    }
}

function processImage(imgData){
    let w = imgData.width, h = imgData.height;

    let opacity = opacityMask(imgData);
    
    opacity = booleanFilter(opacity, 175);
    let outline = edgeDetection(opacity, w, h, 1, 1);
    // outline to list of points
    let points = [];
    for(let i = 0; i < outline.length; i++){
        if(outline[i] == 255)
            points.push([i % w, Math.floor(i / w)]);
    }
    let fullPath, path;
    if(points.length === 0){
        fullPath = [];
        path = [];
    }
    else
    {
        // to path list
        path = [points[0]];
        
        while(points.length > 0){
            let lastPoint = path[path.length - 1];
            // find closest point
            let i = getNearestIndex(points, lastPoint);
            if(sqrDist(lastPoint, points[i]) > 100 ** 2)
                break;
            path.push(points[i]);
            points.splice(i, 1);
        }
        // close loop
        if(sqrDist(path[0], path[path.length - 1]) < 100 ** 2)
            path.push(path[0]);

        fullPath = [...path];
        // reduce number of points in path
        for(let iter = 0; iter < 20; iter++){
            for(let i = 1; i < path.length - 1; i += 2) {
                // cos = (a^2+b^2-c^2)/2ab
                let a2 = sqrDist(path[i - 1], path[i]);
                let b2 = sqrDist(path[i], path[i + 1]);
                let c2 = sqrDist(path[i - 1], path[i + 1]);
                let cos = (a2 + b2 - c2) / (2 * (a2 * b2) ** 0.5);
                
                if(cos < -0.95 || a2 < 15 ** 2 || b2 < 15 ** 2)
                path.splice(i, 1);
            }
        }
    }
    
    // filter image
    let data = toRGB(imgData);
    data = grayscale(data);
    data = bilateralFilter(data, w, h, 7, 2.4, 35);
    data = edgeDetection(data, w, h, 10);
    data = filter(data, w, h, gaussianBlurFilter(5));
    data = booleanFilter(data, 30);
    data = invert(data);
    fromRGB(imgData, data);

    return [fullPath, path];
}

function processColorMap(imgData){
    let w = imgData.width, h = imgData.height;
    let data = toRGB(imgData);

    data = bilateralFilter_x(data, w, h, 21, 7, 120);
    data = bilateralFilter_y(data, w, h, 15, 5, 100);
    
    data = recolorImage(data, 25);

    return data;
}
