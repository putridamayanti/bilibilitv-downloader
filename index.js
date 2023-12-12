const express = require("express");
const bodyParser = require("body-parser");
const https = require('https');
const fs = require('fs');

const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const {GetDetailVideo, DownloadVideo, MergeVideoAudio} = require("./controllers/video");
const {DownloadAudioOnly} = require("./controllers/audio");

const app = express();

app.use(bodyParser.json({ limit: '50mb', extended: false }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization");
    next();
});

app.get('/video', GetDetailVideo);
app.get('/video-download', DownloadVideo);
app.get('/video-merge', MergeVideoAudio);

app.get('/audio-download', DownloadAudioOnly)

const PORT = process.env.PORT || 5000;
app.use(express.static(__dirname + '/app/uploads'));
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}.`);
});

function showProgress(downloaded, totalSize) {
    let percent = Math.round((downloaded / totalSize) * 100)
    console.log(percent + "% downloaded");
}

function downloadVideo() {
    // const url = 'https://upos-bstar1-mirrorakam.akamaized.net/iupxcodeboss/l8/bw/n231122adu2hur550pyf3icebsjqbwl8-1-141210110000.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX\\\\_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj\\\\_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1701433421&gen=playurlv2&os=akam&oi=1738294851&trid=a5126a8e962d4c9ea3ae5d332257bd8ai&mid=0&platform=pc&upsig=4390d12403afb899c6a0f322d95a77e7&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,mid,platform&hdnts=exp=1701433421~hmac=c8432629f6b7f337efe463800b0742f08dc195360c4764dfd31c869506d61fd8&bvc=vod&nettype=0&orderid=0,2&logo=00000000&f=i\\\\_0\\\\_0'; // The long video url
    const url = 'https://upos-bstar1-mirrorakam.akamaized.net/iupxcodeboss/l8/bw/n231122adu2hur550pyf3icebsjqbwl8-1-1c1301000022.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1701438885&gen=playurlv2&os=akam&oi=1738294851&trid=2a530b6f900548c9985fd7096cfb74e5i&mid=0&platform=pc&upsig=5d1344980547902f3351cbdeb2f85c56&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,mid,platform&hdnts=exp=1701438885~hmac=0d217bbc1d6fa16217de2e4c041785fea8b944b2e1bec5cbdf000e327d156d8f&bvc=vod&nettype=0&orderid=0,2&logo=00000000&f=i_0_0'
    const file = fs.createWriteStream("paranoia-audio.m4s");
    let downloaded = 0;

    https.get(url, response => {
        response.on('data', chunk => {
            downloaded += chunk.length;
            showProgress(downloaded, response.headers['content-length'])
        });

        response.pipe(file);

        response.on('end', () => {
            console.log('Video downloaded!');
        });

    });
}

async function mergeVideoAudio() {
    ffmpeg.setFfmpegPath(ffmpegPath);

// Set the paths to your video and audio files
    const videoPath = 'paranoia.mp4';
    const audioPath = 'paranoia-audio.m4s';

// Set the output path for the merged video
    const outputPath = 'output.mp4';

// Merge video and audio
    ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .output(outputPath)
        .on('progress', (progress) => {
            // Display the progress information
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
            console.log('Merging finished');
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .run();
}

// downloadVideo()
// getVideoDetail()
// mergeVideoAudio()