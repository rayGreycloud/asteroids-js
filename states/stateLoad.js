/** @type {HTMLCanvasElement} */
let canv = document.getElementById('gameCanvas');
let ctx = canv.getContext('2d');

// set up sound effects
let fxExplode = new Sound('sounds/explode.m4a');
let fxHit = new Sound('sounds/hit.m4a', 5);
let fxLaser = new Sound('sounds/laser.m4a', 5, 0.5);
let fxThrust = new Sound('sounds/thrust.m4a');

// set up the music
let music = new Music('sounds/music-low.m4a', 'sounds/music-high.m4a');
let roidsLeft, roidsTotal;

// set up the game parameters
let level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  roids = [];
  roidsTotal = (ROID_NUM + level) * 7;
  roidsLeft = roidsTotal;
  let x, y;
  for (let i = 0; i < ROID_NUM + level; i++) {
    // random asteroid location (not touching spaceship)
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2)));
  }
}

function destroyAsteroid(index) {
  let x = roids[index].x;
  let y = roids[index].y;
  let r = roids[index].r;

  // split the asteroid in two if necessary
  if (r == Math.ceil(ROID_SIZE / 2)) {
    // large asteroid
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
    score += ROID_PTS_LGE;
  } else if (r == Math.ceil(ROID_SIZE / 4)) {
    // medium asteroid
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
    score += ROID_PTS_MED;
  } else {
    score += ROID_PTS_SML;
  }

  // check high score
  if (score > scoreHigh) {
    scoreHigh = score;
    localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
  }

  // destroy the asteroid
  roids.splice(index, 1);
  fxHit.play();

  // calculate the ratio of remaining asteroids to determine music tempo
  roidsLeft--;
  music.setAsteroidRatio(roidsLeft / roidsTotal);

  // new level when no more asteroids
  if (roids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = 'white') {
  ctx.strokeStyle = colour;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    // rear left
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    // rear right
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  fxExplode.play();
}

function gameOver() {
  ship.dead = true;
  text = 'Game Over';
  textAlpha = 1.0;
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: // space bar (shoot laser)
      shootLaser();
      break;
    case 37: // left arrow (rotate ship left)
      ship.rot = ((SHIP_TURN_SPD / 180) * Math.PI) / FPS;
      break;
    case 38: // up arrow (thrust the ship forward)
      ship.thrusting = true;
      break;
    case 39: // right arrow (rotate ship right)
      ship.rot = ((-SHIP_TURN_SPD / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: // space bar (allow shooting again)
      ship.canShoot = true;
      break;
    case 37: // left arrow (stop rotating left)
      ship.rot = 0;
      break;
    case 38: // up arrow (stop thrusting)
      ship.thrusting = false;
      break;
    case 39: // right arrow (stop rotating right)
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y, r) {
  let lvlMult = 1 + 0.1 * level;
  let roid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * ROID_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    yv:
      ((Math.random() * ROID_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    a: Math.random() * Math.PI * 2, // in radians
    r: r,
    offs: [],
    vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2)
  };

  // populate the offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
  }

  return roid;
}

function newGame() {
  level = 0;
  lives = GAME_LIVES;
  score = 0;
  ship = newShip();

  // get the high score from local storage
  let scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
  if (scoreStr == null) {
    scoreHigh = 0;
  } else {
    scoreHigh = parseInt(scoreStr);
  }

  newLevel();
}

function newLevel() {
  music.setAsteroidRatio(1);
  text = 'Level ' + (level + 1);
  textAlpha = 1.0;
  createAsteroidBelt();
}

function newShip() {
  return {
    x: canv.width / 2,
    y: canv.height / 2,
    a: (90 / 180) * Math.PI, // convert to radians
    r: SHIP_SIZE / 2,
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0
    }
  };
}

function shootLaser() {
  // create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      // from the nose of the ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0
    });
    fxLaser.play();
  }

  // prevent further shooting
  ship.canShoot = false;
}

function Music(srcLow, srcHigh) {
  this.soundLow = new Audio(srcLow);
  this.soundHigh = new Audio(srcHigh);
  this.low = true;
  this.tempo = 1.0; // seconds per beat
  this.beatTime = 0; // frames left until next beat

  this.play = function() {
    if (MUSIC_ON) {
      if (this.low) {
        this.soundLow.play();
      } else {
        this.soundHigh.play();
      }
      this.low = !this.low;
    }
  };

  this.setAsteroidRatio = function(ratio) {
    this.tempo = 1.0 - 0.75 * (1.0 - ratio);
  };

  this.tick = function() {
    if (this.beatTime == 0) {
      this.play();
      this.beatTime = Math.ceil(this.tempo * FPS);
    } else {
      this.beatTime--;
    }
  };
}

function Sound(src, maxStreams = 1, vol = 1.0) {
  this.streamNum = 0;
  this.streams = [];
  for (let i = 0; i < maxStreams; i++) {
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }

  this.play = function() {
    if (SOUND_ON) {
      this.streamNum = (this.streamNum + 1) % maxStreams;
      this.streams[this.streamNum].play();
    }
  };

  this.stop = function() {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  };
}
