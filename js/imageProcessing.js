
const inputCanvas = document.getElementById("inputCanvas");
const dropZone = document.querySelector(".drop-zone");
const button = document.querySelector(".btn-primary");
const inputContext = inputCanvas.getContext("2d");

let imageData;

const btnConvert = document.getElementById("btn-convert");
const outputCanvas = document.getElementById("outputCanvas");
const outputContext = outputCanvas.getContext("2d");
let imageDataOutput;

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
        const image = new Image();
        image.src = imageData;
        imageDataOutput = processImage(imageData);
        image.onload = () => loadImageToCanvas(img, inputCanvas);
    });

    reader.readAsDataURL(file);
});

document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
});

btnConvert.addEventListener("click", () => {
    outputCanvas.style.display = "block";
    outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const img = new Image();
    img.src = imageDataOutput;
    img.onload = () => loadImageToCanvas(img, outputCanvas)
});

btnProcessing.addEventListener("click", () => {
    outputCanvas.style.display = "none";
});

function processImage(imageData) {
    //  implementation for processing the image data
    let processedImageData = imageData;
    return processedImageData;
}

button.addEventListener("click", () => {
    inputContext.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    fetch("https://dog.ceo/api/breeds/image/random")
        .then((response) => response.json())
        .then((data) => {
            imageData = data.message;
            const img = new Image();
            img.src = imageData;
            imageDataOutput = processImage(imageData);
            img.onload = () => loadImageToCanvas(img, inputCanvas);
        });
});

function loadImageToCanvas(img, canvas){
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    canvas.hidden = false;
}
