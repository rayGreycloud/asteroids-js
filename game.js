const FPS = 30; // frames per second setting
const FRICTION = 0.7; // friction coefficient
const SHIP_SIZE = 30; // ship size in px
const SHIP_THRUST = 5; // acceleration in px/second
const SHIP_TURN_SPEED = 360; // turn speed in degrees per second
const ROID_JAG = 0.4; // jaggedness (0 = none, 1 = lots)
const ROID_NUM = 3; // starting number of asteroids
const ROID_SIZE = 100; // starting size in pixels
const ROID_SPD = 50; // max starting speed in pixels per second
const ROID_VERT = 10; // ave number vertices

// Get the HTMLCanvasElement
let canv = document.getElementById('gameCanvas');
let ctx = canv.getContext('2d');

// Set up space ship
let ship = {
  xPos: canv.width / 2, // position coord
  yPos: canv.height / 2, // position coord
  rad: SHIP_SIZE / 2, // height
  angle: (90 / 180) * Math.PI, // angle - convert degrees into radians
  rot: 0,
  thrusting: false,
  thrust: {
    xPos: 0,
    yPos: 0
  }
};

// Set up asteroids
let roids = [];
createAsteroidBelt();

function createAsteroidBelt() {
  roids = [];
  let x, y;

  for (let i = 0; i < ROID_NUM; i++) {
    // random asteroid location (not touching spaceship)
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (
      distBetweenPoints(ship.xPos, ship.yPos, x, y) <
      ROID_SIZE * 2 + ship.rad
    );

    roids.push(newAsteroid(x, y));
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Set up the game loop
setInterval(update, 1000 / FPS);

// Set up controls
function keyDown(e) {
  switch (e.keyCode) {
    // Left arrow
    case 37:
      ship.rot = ((SHIP_TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    // Up arrow
    case 38:
      ship.thrusting = true;
      break;
    // Right arrow
    case 39:
      ship.rot = ((-SHIP_TURN_SPEED / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp(e) {
  switch (e.keyCode) {
    // Left arrow
    case 37:
      ship.rot = 0;
      break;
    // Up arrow
    case 38:
      ship.thrusting = false;
      break;
    // Right arrow
    case 39:
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y) {
  let roid = {
    a: Math.random() * Math.PI * 2, // in radians
    offs: [],
    r: ROID_SIZE / 2,
    vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2),
    x: x,
    y: y,
    xv: ((Math.random() * ROID_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    yv: ((Math.random() * ROID_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1)
  };

  // populate the offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
  }

  return roid;
}

function update() {
  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canv.width, canv.height);

  // draw ship
  ctx.beginPath();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = SHIP_SIZE / 20;

  // Start at nose of ship
  ctx.moveTo(
    ship.xPos + (4 / 3) * ship.rad * Math.cos(ship.angle),
    ship.yPos - (4 / 3) * ship.rad * Math.sin(ship.angle)
  );
  // Draw line to rear left
  ctx.lineTo(
    ship.xPos -
      ship.rad * ((2 / 3) * Math.cos(ship.angle) + Math.sin(ship.angle)),
    ship.yPos +
      ship.rad * ((2 / 3) * Math.sin(ship.angle) - Math.cos(ship.angle))
  );
  // Draw from rear left to rear right
  ctx.lineTo(
    ship.xPos -
      ship.rad * ((2 / 3) * Math.cos(ship.angle) - Math.sin(ship.angle)),
    ship.yPos +
      ship.rad * ((2 / 3) * Math.sin(ship.angle) + Math.cos(ship.angle))
  );
  // Draw from rear right to nose
  ctx.closePath();
  ctx.stroke();

  // rotate the ship
  ship.angle += ship.rot;

  // Thrust ship
  if (ship.thrusting) {
    ship.thrust.xPos += (SHIP_THRUST * Math.cos(ship.angle)) / FPS;
    ship.thrust.yPos -= (SHIP_THRUST * Math.sin(ship.angle)) / FPS;

    // Draw thruster
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = SHIP_SIZE / 10;
    ctx.moveTo(
      // rear left
      ship.xPos -
        ship.rad *
          ((2 / 3) * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
      ship.yPos +
        ship.rad * ((2 / 3) * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
    );
    ctx.lineTo(
      // rear centre (behind the ship)
      ship.xPos - ((ship.rad * 5) / 3) * Math.cos(ship.angle),
      ship.yPos + ((ship.rad * 5) / 3) * Math.sin(ship.angle)
    );
    ctx.lineTo(
      // rear right
      ship.xPos -
        ship.rad *
          ((2 / 3) * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
      ship.yPos +
        ship.rad * ((2 / 3) * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Apply friction/slow ship
    ship.thrust.xPos -= (FRICTION * ship.thrust.xPos) / FPS;
    ship.thrust.yPos -= (FRICTION * ship.thrust.yPos) / FPS;
  }

  // draw the asteroids
  ctx.strokeStyle = 'slategrey';
  ctx.lineWidth = SHIP_SIZE / 20;
  let a, r, x, y, offs, vert;

  for (let i = 0; i < roids.length; i++) {
    // get the asteroid properties
    a = roids[i].a;
    r = roids[i].r;
    x = roids[i].x;
    y = roids[i].y;
    offs = roids[i].offs;
    vert = roids[i].vert;

    // draw the path
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));

    // draw the polygon
    for (let j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }

    ctx.closePath();
    ctx.stroke();

    // move the asteroid
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    // handle asteroid edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }

  // Move the ship
  ship.xPos += ship.thrust.xPos;
  ship.yPos += ship.thrust.yPos;

  // Handle edge of screen
  if (ship.xPos < 0 - ship.rad) {
    ship.xPos = canv.width + ship.rad;
  } else if (ship.xPos > canv.width + ship.rad) {
    ship.xPos = 0 - ship.rad;
  }

  if (ship.yPos < 0 - ship.rad) {
    ship.yPos = canv.height + ship.rad;
  } else if (ship.yPos > canv.height + ship.rad) {
    ship.yPos = 0 - ship.rad;
  }

  // // Center dot
  // ctx.fillStyle = 'red';
  // ctx.fillRect(ship.xPos - 1, ship.yPos - 1, 2, 2);
}
