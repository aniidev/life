let fps = 0;
let world;
function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    world = new World(20, 1000);
}

function draw() {
    translate(windowWidth/2, windowHeight/2);
    background(25);
    fill('white');
    fps = round(frameRate()/30);
    text(fps * 30, -windowWidth/2 + 15, -windowHeight/2 + 20);
    world.update();
    world.show();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


