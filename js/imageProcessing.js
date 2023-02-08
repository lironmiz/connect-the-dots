
const inputCanvas = document.getElementById("inputCanvas");
const dropZone = document.querySelector(".drop-zone");
const button = document.querySelector(".btn-primary");
const inputContext = inputCanvas.getContext("2d");

let imageData;

const btnConvert = document.getElementById("btn-convert");
const outputCanvas = document.getElementById("outputCanvas");
const outputContext = outputCanvas.getContext("2d");

const btnProcessing = document.getElementById("btn-processing");
const ProcessingStages = [];

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

    reader.addEventListener("load", () => {
        imageData = reader.result;
        loadImageURLToCanvas(imageData, inputCanvas);
        convert(imageData, outputCanvas);
    });

    reader.readAsDataURL(file);
});

document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
});

/*btnConvert.addEventListener("click", () => {
    outputCanvas.style.display = "block";
    outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const img = new Image();
    img.src = imageDataOutput;
    img.onload = () => loadImageToCanvas(img, outputCanvas)
});*/
const WIDTH = 640;
function convert(imageURL, toCanvas){
    toCanvas.style.display = "block";
    toCanvas.getContext("2d").clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const img = new Image();
    img.src = imageURL;
    img.setAttribute('crossOrigin', '');
    img.onload = () => {
        let offscreen = new OffscreenCanvas(WIDTH, WIDTH * img.height / img.width);
        let context = offscreen.getContext('2d');
        context.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        imageData = context.getImageData(0, 0, offscreen.width, offscreen.height, {colorSpace: "srgb"});
        let pathData = processImage(imageData);
        context.putImageData(imageData, 0, 0);
        drawPath(pathData, offscreen);
        copyCanvas(offscreen, toCanvas);
    }
}

btnProcessing.addEventListener("click", () => {
    outputCanvas.style.display = "none";
});

button.addEventListener("click", () => {
    inputContext.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    fetch("https://dog.ceo/api/breeds/image/random")
        .then((response) => response.json())
        .then((data) => {
            imageData = data.message;
            loadImageURLToCanvas(imageData, inputCanvas);
            convert(imageData, outputCanvas);
        });
});

function copyCanvas(fromCanvas, toCanvas){
    toCanvas.width = fromCanvas.width;
    toCanvas.height = fromCanvas.height;
    toCanvas.getContext("2d").drawImage(fromCanvas, 0, 0, toCanvas.width, toCanvas.height);
    canvas.hidden = false;
}

function loadImageURLToCanvas(imageURL, canvas){
    const image = new Image();
    image.src = imageURL;
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.hidden = false;
    };
}

function drawPath(pathData, toCanvas){
    let ctx = toCanvas.getContext("2d");
    let [outline, path] = pathData;

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

function processImage(imageData){
    let w = imageData.width, h = imageData.height;

    let opacity = opacityMask(imageData);
    
    opacity = booleanFilter(opacity, 175);
    let outline = edgeDetection(opacity, w, h, 1, 1);
    // outline to list of points
    let points = [];
    for(let i = 0; i < outline.length; i++){
        if(outline[i] == 255)
            points.push([i % w, Math.floor(i / w)]);
    }
    
    // to path list
    let path = [points[0]];
    
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

    let fullPath = [...path];
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
    
    // filter image
    let data = toRGB(imageData);
    data = grayscale(data);
    //data = filter(data, w, h, gaussianBlurFilter(7));
    data = bilateralFilter(data, w, h, 7, 2.4, 35);
    data = edgeDetection(data, w, h, 10);
    data = filter(data, w, h, gaussianBlurFilter(5));
    data = booleanFilter(data, 30);
    data = invert(data);
    fromRGB(imageData, data);

    return [fullPath, path];
                
    /*data = bilateralFilter_x(data, w, h, 21, 7, 120);
    data = bilateralFilter_y(data, w, h, 15, 5, 100);
    
    data = recolorImage(data, 15);
    data = grayscale(data);

    data = edgeDetection(data, w, h, 7);

    data = filter(data, w, h, [gaussianBlurFilter_1d(9)]);
    data = filter(data, w, h, transpose([gaussianBlurFilter_1d(9)]));

    data = booleanFilter(data, 5);
    data = grayscale(data);
    data = edgeDetection(data, w, h, 3.5);
    data = filter(data, w, h, [gaussianBlurFilter_1d(7)]);
    data = filter(data, w, h, transpose([gaussianBlurFilter_1d(7)]));
    data = booleanFilter(data, 8);

    flood(data, w, h, 85, 85);*/

    // fromRGB(imageData, data);
}
