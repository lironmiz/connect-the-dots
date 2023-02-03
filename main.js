const HEIGHT = 400;

function loadImage(){
    let url = document.getElementById("urlInput").value;
    let image = new Image();
    image.src = "https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_4x3.jpg";
    image.setAttribute('crossOrigin', '');
    image.onload = () => {
        let offscreen = new OffscreenCanvas(HEIGHT * image.width / image.height, HEIGHT);
        let context = offscreen.getContext('2d');
        context.drawImage(image, 0, 0, offscreen.width, offscreen.height);
        imageData = context.getImageData(0, 0, offscreen.width, offscreen.height, {colorSpace: "srgb"});
        process(imageData)

        let onscreen = document.getElementById("tempCanvas");
        onscreen.width = offscreen.width;
        onscreen.height = offscreen.height;
        onscreen.getContext("2d").putImageData(imageData, 0, 0, 0, 0, onscreen.width, onscreen.height);
    };
}

function process(imageData){
    let w = imageData.width, h = imageData.height;
    let data = Array(3 * w * h).fill(0);
    for(let i = 0; i < w; i++)
        for(let j = 0; j < h; j++)
            for(let c = 0; c < 3; c++)
                data[(j * w + i) * 3 + c] = imageData.data[(j * w + i) * 4 + c];
                
    // data = filter(data, w, h, [gaussianBlurFilter_1d(15)]);
    // data = filter(data, w, h, transpose([gaussianBlurFilter_1d(15)]));
    data = bilateralFilter(data, w, h, 15, 5, 100);
    /*data = filter(data, w, h, 
        [[0, -1, 0], 
        [-1, 4, -1], 
        [0, -1, 0]]
    );*/

    for(let i = 0; i < w; i++)
        for(let j = 0; j < h; j++)
            for(let c = 0; c < 3; c++)
                imageData.data[(j * w + i) * 4 + c] = data[(j * w + i) * 3 + c];
    console.log(imageData.data);
}

loadImage();