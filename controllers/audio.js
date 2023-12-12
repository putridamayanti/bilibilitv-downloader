const {Slugify} = require("../utils/helper");
const fs = require("fs");
const https = require("https");

exports.DownloadAudioOnly = (req, res) => {
    const body = req.body;

    const audioPath = `${Slugify(body.title)}-audio.m4s`;
    const fileAudio = fs.createWriteStream(audioPath);

    const audioUrl = body.url;

    let downloadedAudio = 0;

    https.get(audioUrl, response => {
        response.on('data', chunk => {
            downloadedAudio += chunk.length;
            let percent = Math.round((downloadedAudio / response.headers['content-length']) * 100)
            console.log(percent + "% downloaded");
        });

        response.pipe(fileAudio);

        response.on('end', () => {
            console.log('Audio downloaded!');

            res.send({ message: 'Download Complete' })
        });
    });
};