const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// creating the player
class Player {
  constructor({ position, velocity }) {
    this.position = position; // θέση {x, y}
    this.velocity = velocity; // ταχύτητα
    this.rotation = 0; // περιστροφή
  }
  // drawing the player on the screen
  draw() {
    ctx.save();
    // rotate the canvas and bring it back to its original position to make the player look like he is rotating
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.translate(-this.position.x, -this.position.y);

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false); // κύκλος
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();

    // ctx.fillStyle = 'red';
    // ctx.fillRect(this.position.x, this.position.y, 100, 100); // ορθογώνιο παραλληλόγραμμο
    ctx.beginPath(); // ξεκινήστε τη διαδρομή
    ctx.moveTo(this.position.x + 30, this.position.y); // κέντρο του τριγώνου
    ctx.lineTo(this.position.x - 10, this.position.y - 10); // ανεβαίνοντας προς τα πάνω και αριστερά
    ctx.lineTo(this.position.x - 10, this.position.y + 10); // κινείται προς τα κάτω
    ctx.closePath(); // κλείσιμο διαδρομής

    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.restore();
  }
  // ενημέρωση της θέσης των παικτών
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  getVertices() {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ];
  }
}
// drawing of projectiles (βλήματα)
class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2,
      false
    );
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
  }
  // ενημέρωση θέσης βλημάτων
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2,
      false
    );
    ctx.closePath();
    ctx.strokeStyle = 'yellow';
    ctx.stroke();
  }
  // ενημέρωση θέσης βλημάτων
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}
// νέος παίκτης
const player = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});
// the keys for the players movement
const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};
// player speed and rotation speed
const SPEED = 3;
const ROTATIONAL_SPEED = 0.03;
const FRICTION = 0.98;
const PROJECTILE_SPEED = 2.5;
// multiple projectiles array
const projectiles = [];
const asteroids = [];

const intervalID = window.setInterval(() => {
  const index = Math.floor(Math.random() * 4);
  let x, y;
  let vx, vy;
  let radius = 50 * Math.random() + 10;

  switch (index) {
    case 0: //left side of the screen
      x = 0 - radius;
      y = Math.random() * canvas.height;
      vx = 1;
      vy = 0;
      break;
    case 1: //bottom side of the screen
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      vx = 0;
      vy = -1;
      break;
    case 2: //right side of the screen
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      vx = -1;
      vy = 0;
      break;
    case 3: //top side of the screen
      x = Math.random() * canvas.width;
      y = 0 - radius;
      vx = 0;
      vy = 1;
      break;
  }

  asteroids.push(
    new Asteroid({
      position: {
        x: x,
        y: y,
      },
      velocity: {
        x: vx,
        y: vy,
      },
      radius,
    })
  );
}, 1000);

// making the asteroid to dissapear
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;

  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );

  if (distance <= circle1.radius + circle2.radius) {
    return true;
  }

  return false;
}

//Check if the circle is colliding with any of the triangle's edges
function circleTriangleCollision(circle, triangle) {
  for (let i = 0; i < 3; i++) {
    let start = triangle[i];
    let end = triangle[(i + 1) % 3];

    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let length = Math.sqrt(dx * dx + dy * dy);

    let dot =
      ((circle.position.x - start.x) * dx +
        (circle.position.y - start.y) * dy) /
      Math.pow(length, 2);

    let closestX = start.x + dot * dx;
    let closestY = start.y + dot * dy;

    if (!isPointOnLineSegment(closestX, closestY, start, end)) {
      closestX = closestX < start.x ? start.x : end.x;
      closestY = closestY < start.y ? start.y : end.y;
    }

    dx = closestX - circle.position.x;
    dy = closestY - circle.position.y;

    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      return true;
    }
  }

  // No collision
  return false;
}

function isPointOnLineSegment(x, y, start, end) {
  x >= Math.min(start.x, end.x) &&
    x <= Math.max(start.x, end.x) &&
    y >= Math.min(start.y, end.y) &&
    y <= Math.max(start.y, end.y);
}

// making the new frames when the player moves (illusion of movement)
function animate() {
  const animationID = window.requestAnimationFrame(animate);
  console.log('Animation');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.update();
  //rendering from the back of the array when we want to remove things from it
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.update();

    // garbage collection for projectiles
    if (
      projectile.position.x + projectile.radius < 0 || //right side
      projectile.position.x - projectile.radius > canvas.width || //left side
      projectile.position.y - projectile.radius > canvas.height || //top side
      projectile.position.y - projectile.radius < 0 //bottom side
    ) {
      projectiles.splice(i, 1);
    }
  }
  // asteroid management
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    if (circleTriangleCollision(asteroid, player.getVertices())) {
      window.cancelAnimationFrame(animationID);
      clearInterval(intervalID);
    }

    // garbage collection for asteroid
    if (
      asteroid.position.x + asteroid.radius < 0 || //right side
      asteroid.position.x - asteroid.radius > canvas.width || //left side
      asteroid.position.y - asteroid.radius > canvas.height || //top side
      asteroid.position.y - asteroid.radius < 0 //bottom side
    ) {
      asteroids.splice(i, 1);
    }
    // projectiles
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];

      if (circleCollision(asteroid, projectile)) {
        asteroids.splice(i, 1);
        projectiles.splice(j, 1);
      }
    }
  }

  // going forward
  if (keys.w.pressed) {
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;
  } else if (!keys.w.pressed) {
    //deceleration επιβράδυνση
    player.velocity.x *= FRICTION;
    player.velocity.y *= FRICTION;
  }
  // player rotation positive (spinning)
  if (keys.d.pressed) player.rotation += ROTATIONAL_SPEED;
  // player rotation negative (spinning)
  else if (keys.a.pressed) player.rotation -= ROTATIONAL_SPEED;
}
// call funtion
animate();
// waiting for user to press the key
window.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;
    case 'KeyA':
      keys.a.pressed = true;
      break;
    case 'KeyD':
      keys.d.pressed = true;
      break;
    case 'Space':
      projectiles.push(
        new Projectile({
          position: {
            x: player.position.x + Math.cos(player.rotation) * 30,
            y: player.position.y + Math.sin(player.rotation) * 30,
          },
          velocity: {
            x: Math.cos(player.rotation) * PROJECTILE_SPEED,
            y: Math.sin(player.rotation) * PROJECTILE_SPEED,
          },
        })
      );
      break;
  }
});
// waiting for user to let the key
window.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
      console.log('W was pressed');
      keys.w.pressed = false;
      break;
    case 'KeyA':
      console.log('A was pressed');
      keys.a.pressed = false;
      break;
    case 'KeyD':
      console.log('D was pressed');
      keys.d.pressed = false;
      break;
  }
});
