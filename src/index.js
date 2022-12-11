const { UnsplashCrawler } = require('./libraries');

const searchQuery = 'amsterdam'; // type of image to be downloaded
(async function () {
    await UnsplashCrawler.getImages(searchQuery);
})();
