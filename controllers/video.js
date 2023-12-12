const https = require("https");
const fs = require("fs");
const {Slugify, FormatBytes} = require("../utils/helper");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

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

    const videoPath = `${Slugify(body.title)}-video.mp4`;
    const audioPath = `${Slugify(body.title)}-audio.m4s`;
    const fileVideo = fs.createWriteStream(videoPath);
    const fileAudio = fs.createWriteStream(audioPath);

    // const videoUrl = 'https://upos-bstar1-mirrorakam.akamaized.net/iupxcodeboss/l8/bw/n231122adu2hur550pyf3icebsjqbwl8-1-141210110000.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1701585475&gen=playurlv2&os=akam&oi=1738294851&trid=354e189318e84a19b754742c8b19c790i&mid=0&platform=pc&upsig=8a8432e076b0b874b908b86713e6b09d&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,mid,platform&hdnts=exp=1701585475~hmac=34965cd0e2b4bb4a139451bd0bbf2c72402d0f604a0deea5b155a14d55c57310&bvc=vod&nettype=0&orderid=0,2&logo=00000000&f=i_0_0';
    const videoUrl = body.url;
    const audioUrl = body.audio?.url;

    let downloadedVideo = 0;
    let downloadedAudio = 0;

    let successDownloaded = 0;
    https.get(videoUrl, response => {
        response.on('data', chunk => {
            downloadedVideo += chunk.length;
            let percent = Math.round((downloadedVideo / response.headers['content-length']) * 100)
            console.log(percent + "% downloaded");
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
                    console.log(percent + "% downloaded");
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

exports.MergeVideoAudio = (req, res) => {
    ffmpeg.setFfmpegPath(ffmpegPath);

    const videoPath = `./${req.body.video}`;
    const audioPath = `./${req.body.audio}`;
    const outputPath = `./${req.body.output}`;

    ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .output(outputPath)
        .on('progress', (progress) => {
            console.log(progress)
            // console.log(progress.size, progress.length)
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