const https = require("https");
const fs = require("fs");
const {Slugify, FormatBytes} = require("../utils/helper");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const {readdirSync} = require("fs");

exports.GetDetailVideo = (req, res) => {
    const { url } = req.query;
    let aid = url.split('/');
    aid = aid[aid.length - 1];

    const apiUrl = `https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=en_US&platform=web&aid=${aid}&qn=64&type=0&device=wap`;

    let audios = [];
    let videos = [];

    https.get(apiUrl, response => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const parsedData = JSON.parse(data);
            audios = parsedData.data.playurl.audio_resource.map(e => ({
                id: e.id,
                quality: e.quality,
                url: e.url,
                mime_type: e.mime_type,
                size: FormatBytes(e.size, 2)
            }));

            parsedData.data.playurl.video.forEach((e) => {
                if (e.video_resource.url !== '' && e.video_resource.height === 720) {
                    videos.push({
                        id: e.video_resource.id,
                        duration: e.video_resource.duration,
                        url: e.video_resource.url,
                        // backup_url: e.video_resource.backup_url,
                        width: e.video_resource.width,
                        height: e.video_resource.height,
                        mime_type: e.video_resource.mime_type,
                        size: FormatBytes(e.video_resource.size, 2),
                        audio: audios.find(a => a.quality === e.audio_quality)
                    })
                }
            })

            res.send(videos)
        });
    });
}

exports.DownloadVideo = (req, res) => {
    const body = req.body;

    const videoPath = `./downloads/${Slugify(body.title)}-video.mp4`;
    const audioPath = `./downloads/${Slugify(body.title)}-audio.m4s`;
    const fileVideo = fs.createWriteStream(videoPath);
    const fileAudio = fs.createWriteStream(audioPath);

    const videoUrl = body.url;
    const audioUrl = body.audio?.url;

    let downloadedVideo = 0;
    let downloadedAudio = 0;

    let successDownloaded = 0;
    https.get(videoUrl, response => {
        response.on('data', chunk => {
            downloadedVideo += chunk.length;
            let percent = Math.round((downloadedVideo / response.headers['content-length']) * 100)
            console.log(percent.toFixed(0) + "% video downloaded");
        });

        response.pipe(fileVideo);

        response.on('end', () => {
            console.log('Video downloaded!');
            // successDownloaded += 1;
            //
            https.get(audioUrl, response => {
                response.on('data', chunk => {
                    downloadedAudio += chunk.length;
                    let percent = Math.round((downloadedAudio / response.headers['content-length']) * 100)
                    console.log(percent.toFixed(0) + "% audio downloaded");
                });

                response.pipe(fileAudio);

                response.on('end', () => {
                    console.log('Audio downloaded!');
                    successDownloaded += 1;

                    res.send({ message: 'Download Complete' })
                });
            });
        });

        response.on('error', (err) => {
            console.log('Error', err)
            res.send({
                message: err
            })
        });
    });
};

exports.GetLocalVideos = (req, res) => {
    const videos = readdirSync('./downloads')

    res.send({
        data: videos
    });
}

exports.MergeVideoAudio = (req, res) => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('Merging ... ', req.body.video)
    const videoPath = `./downloads/${req.body.video}`;
    const audioPath = `./downloads/${req.body.audio}`;
    const outputPath = `./outputs/${req.body.output}`;
    let totalTime

    ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .output(outputPath)
        .on('codecData', data => {
            totalTime = parseInt(data.duration.replace(/:/g, ''))
        })
        .on('progress', (progress) => {
            const time = parseInt(progress.timemark.replace(/:/g, ''))
            const percent = ((time / totalTime) * 100).toFixed(0)

            console.log(`${percent}%`)
        })
        .on('end', () => {
            console.log('Merging finished');

            res.send({
                message: 'Merge complete'
            });
        })
        .on('error', (err) => {
            console.error('Error:', err);
            res.send({
                message: err
            })
        })
        .run();
};

exports.DeleteDownloadFile = (req, res) => {
    const files = readdirSync('./downloads')
    const currentFiles = files.filter(e => e.includes(req.query.filename));

    currentFiles.forEach((e) => {
        fs.unlinkSync(`./downloads/${e}`);
    });

    res.send({
        data: 'Success'
    })
}

exports.DeleteOutputFile = (req, res) => {

}