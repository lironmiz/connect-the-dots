function filter(data, w, h, kernel, channels=3){
    let newImageData = Array(3 * w * h).fill(0);
    
    for(let p_x = 0; p_x < w; p_x++)
    {
        for(let p_y = 0; p_y < h; p_y++)
        {
            n_y = Math.floor(kernel.length / 2);
            n_x = Math.floor(kernel[0].length / 2);
            for(let i = -n_x; i <= n_x; i++)
            {
                for(let j = -n_y; j <= n_y; j++)
                {
                    x = Math.max(0, Math.min(w - 1, p_x + i));
                    y = Math.max(0, Math.min(h - 1, p_y + j));
                    for(let channel = 0; channel < channels; channel++)
                    {
                        newImageData[(p_y * w + p_x) * channels + channel] += 
                            kernel[j + n_y][i + n_x] * data[(y * w + x) * channels + channel];
                    }
                }
            }
        }
    }
    
    return newImageData;
}

function gaussianBlurFilter(size){
    const center = (size - 1) / 2;
    // size = 6 standard deviations
    // => stDev = size / 3
    // => variance = stDev ** 2
    let variance = (size / 6) ** 2;
    let kernel = new Array(size);
    let sum = 0
    for(let j = 0; j < size; j++)
    {
        kernel[j] = new Array(size);
        for(let i = 0; i < size; i++)
        {
            let squaredDistance = (i - center) * (i - center) + (j - center) * (j - center);
            kernel[j][i] = Math.exp(-squaredDistance / (2 * variance));
            sum += kernel[j][i];
        }
    }

    // normalize (by approx 1/(2*pi*var))
    for(let j = 0; j < size; j++)
        for(let i = 0; i < size; i++)
            kernel[j][i] /= sum;
    return kernel;
}

function gaussianBlurFilter_1d(size){
    const center = (size - 1) / 2;
    // size = 6 standard deviations
    // => stDev = size / 3
    // => variance = stDev ** 2
    let variance = (size / 6) ** 2;
    let kernel = new Array(size);
    let sum = 0;
    for(let i = 0; i < size; i++)
    {
        let squaredDistance = (i - center) * (i - center);
        kernel[i] = Math.exp(-squaredDistance / (2 * variance));
        sum += kernel[i];
    }

    for(let i = 0; i < size; i++)
        kernel[i] /= sum;

    return kernel;
}

function transpose(arr){
    let h = arr.length, w = arr[0].length;
    let newArr = new Array(w);
    for(let j = 0; j < w; j++)
    {
        newArr[j] = new Array(h);
        for(let i = 0; i < h; i++)
        {
            newArr[j][i] = arr[i][j];
        }
    }
    return newArr;
}

function bilateralFilter(data, w, h, size, sigma1, sigma2){
    let newImageData = Array(3 * w * h).fill(0);
    const n = (size - 1) / 2;
    
    for(let p_x = 0; p_x < w; p_x++)
    {
        for(let p_y = 0; p_y < h; p_y++)
        {
            let weightsSum = 0;
            for(let i = -n; i <= n; i++)
            {
                for(let j = -n; j <= n; j++)
                {
                    let x = Math.max(0, Math.min(w - 1, p_x + i));
                    let y = Math.max(0, Math.min(h - 1, p_y + j));

                    let pixelSquareDistance = 0;
                    for(let channel = 0; channel < 3; channel++)
                        pixelSquareDistance += Math.pow(data[(p_y * w + p_x) * 3 + channel] - data[(y * w + x) * 3 + channel], 2)

                    let weight = Math.exp(-(i * i + j * j) / (2 * sigma1 ** 2) - pixelSquareDistance / (2 * sigma2 ** 2));
                    weightsSum += weight;
                    for(let channel = 0; channel < 3; channel++)
                        newImageData[(p_y * w + p_x) * 3 + channel] += weight * data[(y * w + x) * 3 + channel];
                }
            }
            for(let channel = 0; channel < 3; channel++)
                newImageData[(p_y * w + p_x) * 3 + channel] /= weightsSum;
        }
    }

    return newImageData;
}

function bilateralFilter_x(data, w, h, size, sigma1, sigma2){
    let newImageData = Array(3 * w * h).fill(0);
    const n = (size - 1) / 2;
    
    for(let p_x = 0; p_x < w; p_x++)
    {
        for(let p_y = 0; p_y < h; p_y++)
        {
            let weightsSum = 0;
            for(let i = -n; i <= n; i++)
            {
                let x = Math.max(0, Math.min(w - 1, p_x + i));

                let pixelSquareDistance = 0;
                for(let channel = 0; channel < 3; channel++)
                    pixelSquareDistance += Math.pow(data[(p_y * w + p_x) * 3 + channel] - data[(p_y * w + x) * 3 + channel], 2)

                let weight = Math.exp(- i * i / (2 * sigma1 ** 2) - pixelSquareDistance / (2 * sigma2 ** 2));
                weightsSum += weight;
                for(let channel = 0; channel < 3; channel++)
                    newImageData[(p_y * w + p_x) * 3 + channel] += weight * data[(p_y * w + x) * 3 + channel];
            }
            for(let channel = 0; channel < 3; channel++)
                newImageData[(p_y * w + p_x) * 3 + channel] /= weightsSum;
        }
    }

    return newImageData;
}

function bilateralFilter_y(data, w, h, size, sigma1, sigma2){
    let newImageData = Array(3 * w * h).fill(0);
    const n = (size - 1) / 2;
    
    for(let p_x = 0; p_x < w; p_x++)
    {
        for(let p_y = 0; p_y < h; p_y++)
        {
            let weightsSum = 0;
            for(let j = -n; j <= n; j++)
            {
                let y = Math.max(0, Math.min(h - 1, p_y + j));

                let pixelSquareDistance = 0;
                for(let channel = 0; channel < 3; channel++)
                    pixelSquareDistance += Math.pow(data[(p_y * w + p_x) * 3 + channel] - data[(y * w + p_x) * 3 + channel], 2)

                let weight = Math.exp(-j * j / (2 * sigma1 ** 2) - pixelSquareDistance / (2 * sigma2 ** 2));
                weightsSum += weight;
                for(let channel = 0; channel < 3; channel++)
                    newImageData[(p_y * w + p_x) * 3 + channel] += weight * data[(y * w + p_x) * 3 + channel];
            }
            for(let channel = 0; channel < 3; channel++)
                newImageData[(p_y * w + p_x) * 3 + channel] /= weightsSum;
        }
    }

    return newImageData;
}

function grayscale(data)
{
    for(let i = 0; i < data.length; i += 3){
        let [r, g, b] = data.slice(i, i + 3);
        data[i] = data[i + 1] = data[i + 2] = 0.3 * r + 0.59 * g + 0.11 * b;
    }
    return data;
}

function invert(data){
    for(let i = 0; i < data.length; i++)
        data[i] = 255 - data[i];
    return data;
}

function booleanFilter(data, threshold)
{
    for(let i = 0; i < data.length; i++)
        data[i] = data[i] > threshold ? 255 : 0;
    return data;
}

function edgeDetection(data, w, h, s, channels=3)
{
    return filter(data, w, h, 
        [[0, -s, 0], 
        [-s, 4 * s, -s], 
        [0, -s, 0]]
    , channels);
}


let maxN = 0;
function flood(data, w, h, startX, startY, n=0)
{
    let stack = [[startX, startY]];
    while(stack.length > 0)
    {
        const [x, y] = stack.pop();
        let i = (y * w + x) * 3;
        if(!(data[i] == 255 && data[i + 1] == 255 && data[i + 2] == 255))
            continue;
        data[i] = 255;
        data[i + 1] = data[i + 2] = 0;
        for(let o of [[0, 1], [0, -1], [1, 0], [-1, 0]])
            if(0 <= x + o[0] && x + o[0] < w && 0 <= y + o[1] && y + o[1] < h)
                stack.push([x + o[0], y + o[1]]);
    }
}

function recolorImage(data, k)
{
    let centers = KMeansClustering(data, k);
    console.log(centers);
    for(let i = 0; i < data.length; i += 3)
    {
        let colorIndex = getNearestIndex(centers, data.slice(i, i + 3));
        for(let j = 0; j < 3; j++)
            data[i + j] = centers[colorIndex][j];
    }

    return data;
}

function KMeansClustering(data, k)
{
    let centers = new Array(k);
    let clusterSums = new Array(k);
    let clusterSizes = Array(k).fill(0);
    for(let i = 0; i < k; i++)
        centers[i] = [Math.random() * 255, Math.random() * 255, Math.random() * 255];

    for(let iteration = 0; iteration < 40; iteration++){
        for(let i = 0; i < k; i++)
        {
            clusterSums[i] = [0, 0, 0];
            clusterSizes[i] = 0;
        }

        for(let i = 0; i < data.length; i += 3)
        {
            let pixel = data.slice(i, i + 3);
            // find nearest center index
            let nearestIndex = getNearestIndex(centers, pixel);
            for(let j = 0; j < pixel.length; j++)
            {
                clusterSums[nearestIndex][j] += pixel[j];
            }
            clusterSizes[nearestIndex]++;
        }

        for(let i = 0; i < centers.length; i++)
        {
            if(clusterSizes[i] === 0)
                centers[i] = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
            else
                for(let j = 0; j < centers[i].length; j++)
                    centers[i][j] = clusterSums[i][j] / clusterSizes[i];
        }
    }

    return centers;
}

function sqrDist(p1, p2){
    let distanceSquared = 0;
    for(let j = 0; j < p1.length; j++)
        distanceSquared += (p1[j] - p2[j]) ** 2;
    return distanceSquared;
}

function getNearestIndex(points, testPoint)
{
    let minDistanceSquared = Number.POSITIVE_INFINITY;
    let minIndex = 0;
    for(let i = 0; i < points.length; i++)
    {
        let distanceSquared = sqrDist(points[i], testPoint);
        if(distanceSquared < minDistanceSquared)
        {
            minDistanceSquared = distanceSquared;
            minIndex = i;
        }
    }
    return minIndex;
}

function toRGB(imageData){
    let w = imageData.width, h = imageData.height;
    let data = Array(3 * w * h).fill(0);
    for(let i = 0; i < w; i++)
        for(let j = 0; j < h; j++)
            for(let c = 0; c < 3; c++)
                data[(j * w + i) * 3 + c] = imageData.data[(j * w + i) * 4 + c];
    return data;
}

function fromRGB(imageData, rgbData, alpha){
    let w = imageData.width, h = imageData.height;
    for(let i = 0; i < w; i++){
        for(let j = 0; j < h; j++){
            for(let c = 0; c < 3; c++)
                imageData.data[(j * w + i) * 4 + c] = rgbData[(j * w + i) * 3 + c];
            if(alpha !== undefined)
                imageData.data[(j * w + i) * 4 + 3] = alpha;
        }
    }
}

function opacityMask(imageData){
    let data = Array(imageData.width * imageData.height).fill(0);
    for(let i = 0; i < imageData.data.length / 4; i ++){
        data[i] = imageData.data[4 * i + 3];
    }
    return data;
}