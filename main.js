const HEIGHT = 400;

function loadImage(){
    let url = document.getElementById("urlInput").value;
    let image = new Image();
    //image.src = "https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_4x3.jpg";
    image.src = "https://www.envigo.com/hubfs/resources/model-images/golden-syrian-hamster.png";
    image.setAttribute('crossOrigin', '');
    image.onload = () => {
        let offscreen = new OffscreenCanvas(HEIGHT * image.width / image.height, HEIGHT);
        // let offscreen = new OffscreenCanvas(image.width, image.height)

        let context = offscreen.getContext('2d');
        context.drawImage(image, 0, 0, offscreen.width, offscreen.height);
        imageData = context.getImageData(0, 0, offscreen.width, offscreen.height, {colorSpace: "srgb"});
        let path = process(imageData)

        let onscreen = document.getElementById("tempCanvas");
        onscreen.width = offscreen.width;
        onscreen.height = offscreen.height;
        let ctx = onscreen.getContext("2d");
        ctx.putImageData(imageData, 0, 0, 0, 0, onscreen.width, onscreen.height);

        ctx.beginPath();
        ctx.moveTo(...path[0]);
        for(let i = 1; i < path.length; i++){
            ctx.lineTo(...path[i]);
        }
        ctx.stroke();
    };
}

function process(imageData){
    let w = imageData.width, h = imageData.height;

    let data = toRGB(imageData);
    let opacity = opacityMask(imageData);

    opacity = booleanFilter(opacity, 175);
    let outline = edgeDetection(opacity, w, h, 1, 1);
    // outline to list of points
    let points = [];
    for(let i = 0; i < outline.length; i++){
        if(outline[i] == 255)
            points.push([i % w, Math.floor(i / w)]);
    }
    console.log(points);
    // to path list
    let path = [points[0]];
    points.splice(0, 1);
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

    for(let iter = 0; iter < 20; iter++){
        for(let i = 1; i < path.length - 1; i += 2) {
            // cos = (a^2+b^2-c^2)/2ab
            let a2 = sqrDist(path[i - 1], path[i]);
            let b2 = sqrDist(path[i], path[i + 1]);
            let c2 = sqrDist(path[i - 1], path[i + 1]);
            let cos = (a2 + b2 - c2) / (2 * (a2 * b2) ** 0.5);
            
            if(cos < -0.9 || c2 < 225)
                path.splice(i, 1);
        }
    }

    console.log(path);

    for(let i = 0; i < imageData.data.length; i++){
        imageData.data[i] = 255;
    }
    for(let i = 0; i < path.length; i++){
        imageData.data[4 * (path[i][1] * w + path[i][0]) + 1] = 0;
    }

    return path;
                
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

loadImage();