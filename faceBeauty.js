var vid = document.getElementById('videoel');
var vid_width = vid.width;
var vid_height = vid.height;
var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');
var drawSkeleton = document.getElementById('drawSkeleton');
var selectMode = document.getElementById('select');

/*********** Setup of video/webcam and checking for webGL support *********/

function enablestart() {
  var startbutton = document.getElementById('startbutton');
  startbutton.value = "start";
  startbutton.disabled = null;
}

var insertAltVideo = function(video) {
  // insert alternate video if getUserMedia not available
  if (supports_video()) {
    if (supports_webm_video()) {
      video.src = "./media/cap12_edit.webm";
    } else if (supports_h264_baseline_video()) {
      video.src = "./media/cap12_edit.mp4";
    } else {
      return false;
    }
    return true;
  } else return false;
}

function adjustVideoProportions() {
  // resize overlay and video if proportions of video are not 4:3
  // keep same height, just change width
  var proportion = vid.videoWidth/vid.videoHeight;
  vid_width = Math.round(vid_height * proportion);
  vid.width = vid_width;
  overlay.width = vid_width;
}

function gumSuccess( stream ) {
  // add camera stream if getUserMedia succeeded
  if ("srcObject" in vid) {
    vid.srcObject = stream;
  } else {
    vid.src = (window.URL && window.URL.createObjectURL(stream));
  }
  vid.onloadedmetadata = function() {
    adjustVideoProportions();
    vid.play();
  }
  vid.onresize = function() {
    adjustVideoProportions();
    if (trackingStarted) {
      ctrack.stop();
      ctrack.reset();
      ctrack.start(vid);
    }
  }
}

function gumFail() {
  // fall back to video if getUserMedia failed
  insertAltVideo(vid);
  document.getElementById('gum').className = "hide";
  document.getElementById('nogum').className = "nohide";
  alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// set up video
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
} else if (navigator.getUserMedia) {
  navigator.getUserMedia({video : true}, gumSuccess, gumFail);
} else {
  insertAltVideo(vid);
  document.getElementById('gum').className = "hide";
  document.getElementById('nogum').className = "nohide";
  alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
}

vid.addEventListener('canplay', enablestart, false);

/******* multi face tracking ***********/
var objects = new tracking.ObjectTracker(['face']);
var faceRegions = {};

objects.on('track', function(event) {
  if (event.data.length === 0) {
    // no detected
  } else {
    event.data.forEach(function(rect, index) {
      faceRegions[index] = rect
    });
  }
})
//tracking.track('#videoel', objects);

/*********** Code for face tracking *********/

var ctrack = new clm.tracker();
ctrack.init();
var trackingStarted = false;

var boushi = document.getElementById('boushi')
var cheek = document.getElementById('cheek')
var nose1 = document.getElementById('nose1')
var nose2 = document.getElementById('nose2')
var head = document.getElementById('head')

function trackingByRegion(rect) {
  var box = [rect.x, rect.y, rect.width, rect.height];
  ctrack.start(vid, box);
}

function startVideo() {
  // start video
  console.log('hogehogehoge');
  vid.play();
  // start tracking
  ctrack.start(vid);
  trackingStarted = true;
  // start loop to draw face
  drawLoop();
  // realtime filtor
}

function filterImage(ctx) {
  // console.log(filterous);
  /*
          filterous.importImage()
            .applyFilter('brightness', 0.2)
            .renderHtml();

*/
  // var ctx = overlayCC;
  var pixels = ctx.getImageData(0, 0, 400, 300);
  filterous.applyInstaToCanvas(pixels)
    .then((newPixels) => {
      ctx.putImageData(newPixels, 0, 0);
    });
}

function calcPartsPositions(r, w, h) {
  // r: currentPosition
  var o = {};

  var c = 1.3 // 拡大率
  // 表示する画像の幅、高さ
  var w = (r[0][0]-r[14][0])*c;
  var h = w / 7 * 4;
  // 画像の左下の座標(右上が原点)
  var gx = r[14][0]*(2/3 + c/2) + r[0][0]*(2/3 - c/2) - r[7][0]/3
  var gy = r[14][1]*(2/3 + c/2) + r[0][1]*(2/3 - c/2) - r[7][1]/3
  var rad = Math.atan((r[0][1] - r[14][1])/(r[0][0] - r[14][0]))

  o['boushi'] = {gx: gx, gy: gy, rad: rad, w: w, h: h};

  /*
  o['cheek1'] = {
    gx: (r[26][0] + r[44][0])/2,
    gy: (r[26][1] + r[44][1])/2,
    rad: 0,
    w: (r[1][0] - r[13][0]) / 5,
    h: (r[1][0] - r[13][0]) / 5 / 7 * 6
  }
  */
  o['cheek1'] = {
    gx: (r[35][0] + r[39][0])*(1/2) + (r[35][0] - r[39][0])*(1+0.6) - (r[37][0]-r[33][0])*(1/2),
    gy: (r[35][1] + r[39][1])*(1/2) + (r[35][1] - r[39][1])*(1+0.6) - (r[37][1]-r[33][1])*(1/2),
    rad: Math.atan((r[35][1] - r[39][1])/(r[35][0] - r[39][0])),
    w: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*(0.6),
    h: Math.sqrt((r[37][0] - r[33][0])**2 + (r[37][1] - r[33][1])**2)*(0.6)
  }
  o['cheek2'] = {
    gx: (r[35][0] + r[39][0])*(1/2) + (r[39][0] - r[35][0])*(1) - (r[37][0]-r[33][0])*(1/2),
    gy: (r[35][1] + r[39][1])*(1/2) + (r[39][1] - r[35][1])*(1) - (r[37][1]-r[33][1])*(1/2),
    rad: Math.atan((r[35][1] - r[39][1])/(r[35][0] - r[39][0])),
    w: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*(0.6),
    h: Math.sqrt((r[37][0] - r[33][0])**2 + (r[37][1] - r[33][1])**2)*(0.6)
  }

  o['nose1'] = {
    gx: r[62][0] + (r[35][0] - r[39][0]) + (r[33][0] - r[37][0])*0.1,
    gy: r[62][1] + (r[35][1] - r[39][1]) + (r[33][1] - r[37][1])*0.1,
    rad: Math.atan((r[35][1] - r[39][1])/(r[35][0] - r[39][0])),
    w: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*2,
    h: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*2*28/34,
  }

  o['nose2'] = {
    gx: r[62][0] + (r[35][0] - r[39][0]) + (r[33][0] - r[37][0])*0.5,
    gy: r[62][1] + (r[35][1] - r[39][1]) + (r[33][1] - r[37][1])*0.5,
    rad: Math.atan((r[35][1] - r[39][1])/(r[35][0] - r[39][0])),
    w: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*2,
    h: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*2*28/34,
  }

  o['head'] = {
    gx: r[1][0] + (r[1][0] - r[13][0])*(0.6) + (r[33][0] - r[37][0])*3,
    gy: r[1][1] + (r[1][1] - r[13][1])*(0.6) + (r[33][1] - r[37][1])*3,
    rad: Math.atan((r[13][1] - r[1][1])/(r[13][0] - r[1][0])),
    w: Math.sqrt((r[13][0] - r[1][0])**2 + (r[13][1] - r[1][1])**2)*2.2,
    h: Math.sqrt((r[33][0] - r[37][0])**2 + (r[33][1] - r[37][1])**2)*4,
  }

  o['head2'] = {
    gx: (r[35][0] + r[39][0])*(1/2) + (r[35][0] - r[39][0])*(3) - (r[37][0]-r[33][0])*(2),
    gy: (r[35][1] + r[39][1])*(1/2) + (r[35][1] - r[39][1])*(3) - (r[37][1]-r[33][1])*(2),
    rad: Math.atan((r[35][1] - r[39][1])/(r[35][0] - r[39][0])),
    w: Math.sqrt((r[39][0] - r[35][0])**2 + (r[39][1] - r[35][1])**2)*(5),
    h: Math.sqrt((r[37][0] - r[33][0])**2 + (r[37][1] - r[33][1])**2)*(5)
  }

  return o
}

function overlayParts(ctx, parts, position) {
  /**
   * 画像を回転して指定の位置に描画する
   */
  ctx.translate(position.gx, position.gy);
  ctx.rotate(position.rad);
  ctx.drawImage(parts, 0, 0, position.w, position.h);
  ctx.rotate(-position.rad);
  ctx.translate(-position.gx, -position.gy);
}

function drawLoop() {
  //console.log('[f]', faceRegions);
  requestAnimFrame(drawLoop);
  overlayCC.clearRect(0, 0, vid_width, vid_height);
  //psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);

  // カメラの画像を書き出す
  overlayCC.drawImage(vid, 0, 0, vid_width, vid_height); 

  if (ctrack.getCurrentPosition()) {
    var r = ctrack.getCurrentPosition()
    // console.log(r)
    if (drawSkeleton.checked) {
      ctrack.draw(overlay);
    }
    var parts = calcPartsPositions(r);

    var idx = selectMode.selectedIndex

  }
  // インスタフィルター
  filterImage(overlayCC);
}

/*********** Code for stats **********/

stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.getElementById('container').appendChild( stats.domElement );

// update stats on every iteration
document.addEventListener('clmtrackrIteration', function(event) {
  stats.update();
}, false);

