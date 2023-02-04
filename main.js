const HEIGHT = 400;

function loadImage(){
    let url = document.getElementById("urlInput").value;
    let image = new Image();
    image.src = "https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_4x3.jpg";
    image.setAttribute('crossOrigin', '');
    image.onload = () => {
        let offscreen = new OffscreenCanvas(HEIGHT * image.width / image.height, HEIGHT);
        // let offscreen = new OffscreenCanvas(image.width, image.height)

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

    data = bilateralFilter(data, w, h, 11, 5, 100);
    /*data = filter(data, w, h, 
        [[0, -1, 0], 
        [-1, 4, -1], 
        [0, -1, 0]]
    );*/
    data = recolorImage(data, w, h);

    for(let i = 0; i < w; i++)
        for(let j = 0; j < h; j++)
            for(let c = 0; c < 3; c++)
                imageData.data[(j * w + i) * 4 + c] = data[(j * w + i) * 3 + c];
}

function recolorImage(data, w, h)
{
    let centers = KMeansClustering(data, w, h, 10);
    console.log(centers);
    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            let i = (y * w + x) * 3;
            let point = data.slice(i, i + 3).concat([x / w, y / h]);
            for(let j = 0; j < 3; j++)
                point[j] /= 256;
            let colorIndex = getNearestIndex(centers, point);
            for(let j = 0; j < 3; j++)
                data[i + j] = centers[colorIndex][j] * 256;
        }
    }

    return data;
}

function KMeansClustering(data, w, h, k)
{
    let centers = new Array(k);
    let clusterSums = new Array(k);
    let clusterSizes = Array(k).fill(0);
    for(let i = 0; i < k; i++)
        centers[i] = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];

    for(let iteration = 0; iteration < 20; iteration++){
        for(let i = 0; i < k; i++)
        {
            clusterSums[i] = [0, 0, 0, 0, 0];
            clusterSizes[i] = 0;
        }

        for(let x = 0; x < w; x++)
        {
            for(let y = 0; y < h; y++)
            {
                let i = (y * w + x) * 3;
                let pixel = data.slice(i, i + 3);
                for(let j = 0; j < 3; j++)
                    pixel[j] /= 256;
                // find nearest center index
                let nearestIndex = getNearestIndex(centers, pixel);
                for(let j = 0; j < pixel.length; j++)
                {
                    clusterSums[nearestIndex][j] += pixel[j];
                }
                clusterSums[nearestIndex][3] += x / w;
                clusterSums[nearestIndex][4] += y / h;

                clusterSizes[nearestIndex]++;
            }
        }

        for(let i = 0; i < centers.length; i++)
        {
            if(clusterSizes[i] === 0)
                centers[i] = [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()];
            else
                for(let j = 0; j < centers[i].length; j++)
                    centers[i][j] = clusterSums[i][j] / clusterSizes[i];
        }
    }

    return centers;
}

function getNearestIndex(points, testPoint)
{
    let minDistanceSquared = Number.POSITIVE_INFINITY;
    let minIndex = 0;
    for(let i = 0; i < points.length; i++)
    {
        let distanceSquared = 0;
        for(let j = 0; j < testPoint.length; j++)
            distanceSquared += (points[i][j] - testPoint[j]) ** 2;
        if(distanceSquared < minDistanceSquared)
        {
            minDistanceSquared = distanceSquared;
            minIndex = i;
        }
    }
    return minIndex;
}

loadImage();