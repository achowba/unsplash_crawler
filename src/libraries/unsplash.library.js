const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

class UnsplashCrawler {
    constructor() {
        this.downloadPath = `downloads`;
        this.baseURL = `https://unsplash.com/search/photos`;
    };

    /**
     *
     * @param {String} searchQuery - image to be searched and downloaded|
     * @returns Promise<Object[]>
     */
    async getImages(searchQuery) {
        const data = await this.fetchDataFromUnsplash(searchQuery);
        const images = this.extractImages(data);

        this.saveImages(images, searchQuery);
    }

    /**
     *
     * @param {String} searchQuery - image to be searched and downloaded
     * @returns Promise<Object[]>
     */
    async fetchDataFromUnsplash(searchQuery) {
        const response = await axios.get(`${this.baseURL}/${searchQuery}`);
        return response.data;
    }

    /**
     *
     * @param {Object[]} data
     * @returns Object[]
     */
    extractImages(data) {
        const results = [];

        if (!data) {
            console.log('No Images found!');
            return results;
        }

        console.log('Extracting Images...\n');

        const $ = cheerio.load(data);
        $(`a[title='Download photo']`).map((index, imageSrc) => {
            results.push($(imageSrc).attr('href'));
        });

        return Array.from(new Set(results)); // remove duplicate images
    }

    /**
     *
     * @param {Array[String]} images
     * @param {String} searchQuery
     */
    async saveImages(images, searchQuery) {
        const folderPath = `${this.downloadPath}/${searchQuery}`;

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        images.forEach(async (imageSrc, index) => {
            const response = await this.downloadImage(imageSrc);

            response.data.pipe(
                this.saveImageToFolder(folderPath, imageSrc, searchQuery, index)
                    .on('finish', () => {
                        this.saveImageUrlToFile(imageSrc, searchQuery, index);
                        console.log(`[Saved] Image ${searchQuery}-${index}.jpg`);
                    })
            );
        });
    }

    /**
     *
     * @param {String} imageSrc - url of image
     * @returns Promise
     */
    async downloadImage(imageSrc) {
        console.log(`[Downloading] Image from URL: ${imageSrc}`);
        return axios.get(imageSrc, { responseType: 'stream' });
    }

    /**
     *
     * @param {String} folderPath - folder where images should be saved
     * @param {string} imageSrc - url of image being saved
     * @param {String} searchQuery - image to be searched and downloaded|
     * @param {Number} index
     */
    saveImageToFolder(folderPath, imageSrc, searchQuery, index) {
        console.log(`[Saving] Image ${searchQuery}-${index}.jpg to folder: ${folderPath}`);
        return fs.createWriteStream(`./${folderPath}/${searchQuery}-${index}.jpg`);
    }

    /**
     *
     * @param {String} imageSrc - image url/source
     * @param {String} searchQuery - image to be searched and downloaded
     * @param {Number} index
     * @returns
     */
    saveImageUrlToFile(imageSrc, searchQuery, index) {
        const imagePath = `${this.downloadPath}/${searchQuery}`;
        const file = fs.createWriteStream(`${imagePath}/${searchQuery}.txt`, {
            flags: 'a' // 'a' means append new data to the existing data
        });

        const imageInfo = `${searchQuery}-${index}.jpg: ${imageSrc}\n`.replace('force=true', '');
        file.write(imageInfo);

        return;
    }
}

module.exports = new UnsplashCrawler;
