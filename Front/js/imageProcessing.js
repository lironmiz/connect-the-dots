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
let scale = 1;

let removeBackgroundOn = false;
let backgroundChanged = false;
inputCanvas.addEventListener("mousedown", (e) => {
    removeBackgroundImageData = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height, {colorSpace: 'srgb'});
    removeBackgroundOn = true;
    removeBackground(e);
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
    let rect = inputCanvas.getBoundingClientRect();
    let w = inputCanvas.width, h = inputCanvas.height;
    const x = Math.floor((e.clientX - rect.left) / (rect.right - rect.left) * w);
    const y = Math.floor((e.clientY - rect.top) / (rect.bottom - rect.top) * h);
    // make transparent
    removeBackgroundAt(x, y);
    const r = 9;
    let removeCount = 0;
    for(let i = -r; i <= r; i++){
        for(let j = -r; j <= r; j++){
            if(i * i + j * j <= r * r && (0 <= x + i && x + i < outputCanvas.width && 0 <= y + j && y + j < outputCanvas.height)){
                let k = ((y + j) * w + (x + i)) * 4 + 3;
                removeCount++;
                if(removeBackgroundImageData.data[k] != 0){
                    removeCount++;
                    removeBackgroundImageData.data[k] = 0;
                }
            }
        }
    }
    if(removeCount != 0){
        backgroundChanged = true;
        setReprocess();
    }
}

function removeBackgroundAt(x, y){
    visitMap = flood(colorMap, outputCanvas.width, outputCanvas.height, x, y);
    let removeCount = 0;
    for(let i = 0; i < visitMap.length; i++){
        if(visitMap[i]){
            if(removeBackgroundImageData.data[4 * i + 3] != 0){
                removeCount++;
                removeBackgroundImageData.data[4 * i + 3] = 0;
            }
        }
    }
    if(removeCount !== 0){
        backgroundChanged = true;
        setReprocess();
    }
}

setInterval(() => {
    if(backgroundChanged){
        inputContext.putImageData(removeBackgroundImageData, 0, 0);
    }
    backgroundChanged = false;
}, 100);

let reprocessTimeout;
function setReprocess(){
    if(reprocessTimeout)
        clearTimeout(reprocessTimeout);
    reprocessTimeout = setTimeout(() => {
        reprocessTimeout = null;
        let data = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height, {colorSpace: 'srgb'});
        convertProcess(data, outputCanvas, false);
    }, 750);
}

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

    scale = (toCanvas.width * toCanvas.height) ** 0.4 / 125;
    
    imageData = fromCanvas.getContext('2d').getImageData(0, 0, fromCanvas.width, fromCanvas.height, {colorSpace: 'srgb'});
    tempData = fromCanvas.getContext('2d').getImageData(0, 0, fromCanvas.width, fromCanvas.height, {colorSpace: 'srgb'});
    
    convertProcess(tempData, toCanvas);
}

function wait(time){
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
}

async function convertProcess(imgData, toCanvas, generateColorMap=true){
    document.getElementById('loading-container').hidden = false;
    await wait(100);

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
    drawPath(pathData, toCanvas, scale);

    toCanvas.hidden = false;
    btnUpload.disabled = false;
    btnDownload.disabled = false;
    btnPrint.disabled = false;
    document.getElementById('loading-container').hidden = true;
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
    
    // filter image
    let data = toRGB(imgData);
    data = grayscale(data);
    data = filter(data, w, h, [gaussianBlurFilter_1d(7)]);
    data = filter(data, w, h, transpose([gaussianBlurFilter_1d(7)]));
    data = edgeDetection(data, w, h, 10);
    data = filter(data, w, h, [gaussianBlurFilter_1d(5)]);
    data = filter(data, w, h, transpose([gaussianBlurFilter_1d(5)]));
    data = booleanFilter(data, 30);
    data = invert(data);
    fromRGB(imgData, data);

    let res = pointsToPath(points, scale);
    return res;
}

function processColorMap(imgData){
    let w = imgData.width, h = imgData.height;

    let data = toRGB(imgData);

    data = filter(data, w, h, [gaussianBlurFilter_1d(15)]);
    data = filter(data, w, h, transpose([gaussianBlurFilter_1d(15)]));

    data = recolorImage(data, w, h, 25);

    return data;
}
