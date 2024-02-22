let video = document.getElementById("myvideo");
let isVideo = false;
let model = {};
let ripples = [];
let currentPositions = {};
let previousPositions = {};
let lastDetectionFrame = -1;
const detectionInterval = 100; 
let lastHandDetectedTime = 0;

const modelParams = {
    flipHorizontal: true,
    maxNumBoxes: 20,
    scoreThreshold: 0.5,
    modelType: 'ssd320fpnlite',
    modelSize: 'large',
};

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    colorMode(RGB, 255);
    startVideo();
    texturize(500);
}

function draw() {
    frameRate(60);

    if (frameCount % 120 === 0) {
        texturize(200);
    }
    
    if (isVideo && frameCount - lastDetectionFrame > detectionInterval) {
        startDetection();
        lastDetectionFrame = frameCount;
    }

    drawRipples();
}

function startVideo() {
    handTrack.startVideo(video).then(function(status) {
        if (status) {
            isVideo = true;
        }
    });
}

handTrack.load(modelParams).then(lmodel => {
    model = lmodel;
    startDetection();
});

function startDetection() {
    if (isVideo) {
        runDetection();
    }
}

function runDetection(){
    if (Object.keys(model).length > 0) {
        model.detect(video).then(predictions => {
            Object.keys(predictions).forEach((prediction) => {
                if (predictions[prediction].label !== 'face') {
                    drawWatercolorEffect(predictions);
                } 
            })
        });
        requestAnimationFrame(runDetection);
    }
}

const colors = [
    {h: 255, s: 234, b: 177}, //#FFEAB1 yellow
    {h: 233, s: 87, b: 87}, //#DF5757 red
    {h: 79, s: 123, b: 255} //#4F7BFF blue
];

function drawWatercolorEffect(predictions) {
    currentPositions = {};

    predictions.forEach((prediction, index) => {
        if (prediction.label !== 'face') {
            if (prediction.label === 'closed' && prediction.score > 0.7) {
                window.location.reload();
            }

            let colorIndex = index % colors.length;
            let hue = colors[colorIndex].h;
            let saturation = colors[colorIndex].s;
            let brightness = colors[colorIndex].b;
            let x = prediction.bbox[0] * 3 + prediction.bbox[2];
            let y = prediction.bbox[1] * 4 + prediction.bbox[3];
            let radius = 50;
            drawSpot(x, y, radius, hue, saturation, brightness);

            let key = `hand${index}`;
            currentPositions[key] = {x, y};

            if (!previousPositions[key] || dist(x, y, previousPositions[key].x, previousPositions[key].y) > 50) {
                ripples.push({
                    x, y, radius: 0, hue, alpha: 255, key: `ripple${index}`
                });                
            }
        }
    });
}

function drawRipples() {
    ripples.forEach((ripple, index) => {
        ripple.radius += 2;
        ripple.alpha -= 10;

        if (ripple.alpha < 0) {
            ripple.alpha = 0;
        }

        if (ripple.alpha > 0) {
            let phase = ripple.radius % 150 / 150;
            
            let color;
            if (phase < 0.33) {
                color = interpolateColor(colors[2], colors[1], phase / 0.33);
            } else if (phase < 0.40) {
                color = interpolateColor(colors[1], colors[0], (phase - 0.33) / 0.33);
            } else {
                color = interpolateColor(colors[0], colors[2], (phase - 0.66) / 0.34);
            }

            stroke(color.h, color.s, color.b, ripple.alpha);
            fill(color.h, color.s, color.b, ripple.alpha)
            strokeWeight(0.5);
            ellipse(ripple.x, ripple.y, ripple.radius * 4, ripple.radius * 4);
        }
    });
}

function interpolateColor(color1, color2, fraction) {
    let h = color1.h + (color2.h - color1.h) * fraction;
    let s = color1.s + (color2.s - color1.s) * fraction;
    let b = color1.b + (color2.b - color1.b) * fraction;
    return {h, s, b};
}

function texturize(density) {
    for(let i = 0; i < density; i++) {
        stroke(random(100), 90, 90, random(5, 15));
        let x1 = random(width);
        let y1 = random(height);
        let theta = random(TWO_PI);
        let segmentLength = random(2, 7);
        let x2 = cos(theta) * segmentLength + x1;
        let y2 = sin(theta) * segmentLength + y1;
        line(x1, y1, x2, y2);
    }
}

function drawSpot(x, y, radius, hue, saturation, brightness) {
    fill(hue, saturation, brightness, 10);
    ellipse(x, y, radius, radius);
    noFill();
    for(let i = 6; i > 0; i--) {
        stroke(hue, saturation, brightness, 3);
        strokeWeight(i);
        ellipse(x, y, radius - i * 2, radius - i * 2);
    }
}
