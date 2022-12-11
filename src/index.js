const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

let imageType = 'abu dhabi'; // type of image to be downloaded
let imagesSrcArray = []; // array to store images

// get the content from unsplash
function fetchDataFromUnsplash() {
    console.log('Fetching Data From Unsplash...');

    return axios
        .get(`https://unsplash.com/search/photos/${imageType}`)
        .then((res) => {
            return res.data;
        }).catch((err) => {
            throw err;
        });
}

// this function extract the images from the url and appends them to an array
function extractImages (data) {
    return new Promise((resolve, reject) => {
        if (data) {
            console.log('Extracting Images...');

            const $ = cheerio.load(data);
            $('a[title="Download photo"]').map((index, imageLink) => {
                imagesSrcArray.push($(imageLink).attr("href")); // push each image url to an array
                imagesSrcArray = Array.from(new Set(imagesSrcArray)); // this was done to remove duplicate images
            });

            resolve(imagesSrcArray);
        }

        reject('No Image Found!');
    });
}

// save image url to a text file
function saveImageUrlToFile (imageSrc, index, imageType) {
    const logger = fs.createWriteStream(`images/${imageType}.txt`, {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });

    // check if the image has the '/download?force=true' attribute in its URL and removes it
    if (imageSrc.includes('&force=true') === true) {
        imageSrc = imageSrc.replace('&force=true', '');
        logger.write(`${imageType}-${index}.jpg: ${imageSrc}\n`);
    }

    return;
}

// saving the images to a folder
function saveImagesToFolder (imageArray) {
    fs.existsSync("images") || fs.mkdirSync("images"); // this checks if the images folder exists and creates it only if it does not exist

    // loop through the array and make a network request for each image in the array
    imageArray.map((image, index) => {
        axios({
            method: "get",
            url: image,
            responseType: "stream"
        })
        .then((res) => {
            res.data.pipe(
                // save each of the requested images to the images folder
                fs.createWriteStream(`./images/${imageType}-${index}.jpg`)
                    .on('finish', () => {
                        saveImageUrlToFile(image, index, imageType); // the saveImageUrlToFile function is called when each image downloads successfully
                        console.log(`Downloaded Image ${imageType}-${index}.jpg`);
                    })
            );
        })
        .catch((e) => {
            console.log(`Failed to download image at ${index}`, e);
        });
    });
}

// putting it all together
async function getImages () {
    let data = await fetchDataFromUnsplash(); // await the response of the function and assign the return value to data
    let images = await extractImages(data); // await the response of the function and assign the return value to images
    saveImagesToFolder(images); // save the images to a folder
}

getImages();
