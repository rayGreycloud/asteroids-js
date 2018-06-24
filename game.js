const FPS = 30; // frames per second setting
const FRICTION = 0.7; // friction coefficient
const SHIP_SIZE = 30; // ship size in px
const SHIP_THRUST = 5; // acceleration in px/second
const TURN_SPEED = 360; // turn speed in degrees per second

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
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    // Up arrow
    case 38:
      ship.thrusting = true;
      break;
    // Right arrow
    case 39:
      ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
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
