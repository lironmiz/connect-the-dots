window.addEventListener("DOMContentLoaded", (event) => {
    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector("#mainNav");
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove("navbar-shrink");
        } else {
            navbarCollapsible.classList.add("navbar-shrink");
        }
    };

    // Shrink the navbar
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener("scroll", navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector("#mainNav");
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: "#mainNav",
            offset: 74,
        });
    }

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector(".navbar-toggler");
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll("#navbarResponsive .nav-link")
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener("click", () => {
            if (window.getComputedStyle(navbarToggler).display !== "none") {
                navbarToggler.click();
            }
        });
    });
});

var canvas = document.getElementById("myCanvas");
const dropZone = document.querySelector(".drop-zone");
const button = document.querySelector(".btn-primary");
const ctx = canvas.getContext("2d");

let imageData;

const btnConvert = document.getElementById("btn-convert");
const canvasOutput = document.querySelector(".outputCanvas");
const ctxOutput = canvasOutput.getContext("2d");
let imageDataOutput;

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
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0, image.width, image.height);
        };
    });

    reader.readAsDataURL(file);
});

button.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fetch("https://dog.ceo/api/breeds/image/random")
        .then((response) => response.json())
        .then((data) => {
            imageData = data.message;
            const img = new Image();
            img.src = imageData;
            imageDataOutput = processImage(imageData);
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
        });
});

document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
});

function processImage(imageData) {
    //  implementation for processing the image data
    let processedImageData = imageData;
    return processedImageData;
}



btnConvert.addEventListener("click", () => {
    ctxOutput.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
    const img = new Image();
    img.src = imageDataOutput;
    img.onload = function () {
        canvasOutput.width = img.width;
        canvasOutput.height = img.height;
        ctxOutput.drawImage(img, 0, 0);
    };
});
