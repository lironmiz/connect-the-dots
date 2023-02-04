function filter(data, w, h, kernel){
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
                    for(let channel = 0; channel < 3; channel++)
                    {
                        newImageData[(p_y * w + p_x) * 3 + channel] += 
                            kernel[j + n_y][i + n_x] * data[(y * w + x) * 3 + channel];
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
