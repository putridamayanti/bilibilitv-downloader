const express = require("express");
const bodyParser = require("body-parser");
const ngrok = require("@ngrok/ngrok");

const {GetDetailVideo, DownloadVideo, MergeVideoAudio} = require("./controllers/video");
const {DownloadAudioOnly} = require("./controllers/audio");
const {GetLocalVideos, GetMergedVideos} = require("./services/video");

const app = express();

require('dotenv').config()

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
app.post('/video-download', DownloadVideo);
app.post('/video-merge', MergeVideoAudio);
app.get('/local-video', GetLocalVideos);
app.get('/merged-video', GetMergedVideos);
app.get('/audio-download', DownloadAudioOnly)

app.get('/audio-download', DownloadAudioOnly)

const PORT = process.env.PORT || 5100;
app.use(express.static(__dirname + '/app/uploads'));
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}.`);
});

(async function () {
    const listener = await ngrok.forward({
        addr: PORT,
        authtoken_from_env: true,
    });

    console.log(`Ingress established at: ${listener.url()}`);
})();