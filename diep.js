const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const UPDATE_LOAD_COEFF = 0.5;
let targetInterval = 1000 / 60;
let prevTime = Date.now() - targetInterval;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let scroolX = 0;
let scroolY = 0;
let mouseX = Infinity;
let mouseY = 0;
let keys = {};
let mouseDown = false;
let shapeCount = Number(prompt("Enter the number of shapes")) / 1000;//20
const xpBoost = 10;
let roomSize = Number(prompt("Enter the room size"))//5000
const roomBorder = 100;//100

let polygons = [];
let bullets = [];

class Polygon {
    constructor(x, y, sides) {
        this.x = x;
        this.y = y;
        this.direction = Math.random() * Math.PI * 2;
        this.vx = 0;
        this.vy = 0;
        this.ax = Math.cos(this.direction) / 100;
        this.ay = Math.sin(this.direction) / 100;
        this.deg = Math.random() * Math.PI * 2;
        this.sides = Math.random() < 0.7 ? 4 :
            (Math.random() < 0.75 ? 3 :
                (Math.random() < 0.97 ? 5 :
                    50));
        if (Math.random() < 0.03) {
            this.sides = 14;
        }
        if (Math.random() < 0.1) {
            this.sides = 1000;
        }
        // if (Math.random() < 0.1) {
        //     this.sides = 2;
        // }
        this.ω = Math.random() > 0.5 ? (800 + Math.random() * 400) : -(800 + Math.random() * 400);
        this.damaged = false;
        this.alpha = 1;
        if (sides) {
            this.sides = sides;
        }
        switch (this.sides) {
            case 4:
                this.health = 10;
                this.size = 40 / 1.25;
                this.xp = 10;
                break;

            case 3:
                this.health = 30;
                this.size = 41 / 1.25;
                this.xp = 25;
                break;

            case 5:
                this.health = 130;
                this.size = 54 / 1.25;
                this.xp = 100;
                break;
            case 2:
                this.health = 20;
                this.size = 100 / 1.25;
                this.xp = 80;
                break;

            case 14:
                this.health = 25000;
                this.size = 500 / 1.25;
                this.xp = 4000;
                break;

            case 50:
                this.health = 3000;
                this.size = 140 / 1.25;
                this.xp = 3000;
                this.to5 = true;
                break;
            case 1000:
                this.health = 10;
                this.size = 30 / 1.25;
                this.xp = 10;
                break;

        }
        this.xp *= xpBoost;
        this.damage = 2;
        this.maxHealth = this.health;
        this.isKilled = false;
    }
    update() {
        this.vx += this.ax;
        this.vx *= 0.95;
        this.x += this.vx;

        this.vy += this.ay;
        this.vy *= 0.95;
        this.y += this.vy;

        this.deg += Math.PI / this.ω;
        this.x2 = this.x + scroolX + centerX - roomSize / 2;
        this.y2 = this.y + scroolY + centerY - roomSize / 2;
        if (Math.abs(this.x - roomSize / 2) > roomSize / 2) {
            this.x -= this.vx;
            this.ax *= -1;
        }
        if (Math.abs(this.y - roomSize / 2) > roomSize / 2) {
            this.y -= this.vy;
            this.ay *= -1;
        }

        this.damaged = false;
        for (let i = 0; i < polygons.length; i++) {
            const checked = checkCollision(this.x2, this.y2, this.size, polygons[i].x2, polygons[i].y2, polygons[i].size);
            if (checked.check && checked.dx > 0 && this.alpha === 1 && polygons[i].alpha === 1) {
                this.vx -= checked.dx * 200 / (this.size ** 2);
                this.vy -= checked.dy * 200 / (this.size ** 2);
                polygons[i].vx += checked.dx * 200 / (polygons[i].size ** 2);
                polygons[i].vy += checked.dy * 200 / (polygons[i].size ** 2);
            }
        }
        if (this.health <= 0) {
            const newSA = killed(this.size, this.alpha);
            this.size = newSA.size;
            this.alpha = newSA.alpha;
            if (!this.isKilled) {
                basic.xp += this.xp;
                this.isKilled = true;
            }
            if (Math.random() < 0.2 && this.sides !== 2) {
                for (let i = 0; i < Math.min(this.sides, 100); i++) {
                    polygons.push(new Polygon(this.x, this.y, 2));
                }
            }
        }
    }
    draw() {
        ctx.beginPath();
        switch (this.sides) {
            case 4:
                ctx.fillStyle = `rgba(255, 232, 105, ${this.alpha}`;
                break;
            case 3:
                ctx.fillStyle = `rgba(252, 118, 119, ${this.alpha}`;
                break;
            case 5:
                ctx.fillStyle = `rgba(118, 141, 252, ${this.alpha}`;
                break;
            case 50:
                ctx.fillStyle = `rgba(118, 141, 252, ${this.alpha}`;
                break;
            case 14:
                ctx.fillStyle = `rgba(0, 255, 0, ${this.alpha}`;
                break;
            case 1000:
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha}`;
                break;
            case 2:
                ctx.fillStyle = `rgba(Number(Math.random() * 255), Number(Math.random() * 255), Number(Math.random() * 255), ${this.alpha})`;
                break;
        }
        ctx.moveTo(this.x2 + Math.cos(this.deg) * this.size * 1.25, this.y2 + Math.sin(this.deg) * this.size * 1.25);
        if (this.to5) {
            this.sides = 5;
        }
        for (let i = 0; i < this.sides + 1; i++) {
            ctx.lineTo(
                this.x2 + Math.cos(this.deg + i * (Math.PI * 2 / this.sides)) * this.size * 1.25,
                this.y2 + Math.sin(this.deg + i * (Math.PI * 2 / this.sides)) * this.size * 1.25);
        }
        if (this.to5) {
            this.sides = 50;
        }
        damaged(this.damaged, this.alpha);
        ctx.fill();
        border(this.alpha);
        healthBar(this.x2, this.y2 + 5, this.size * 1.25, this.health, this.maxHealth, this.alpha);
    }
}

class Basic {
    constructor(lvl) {
        this.x = centerX;
        this.y = centerY;
        this.lvl = lvl;
        this.xp = 0;
        this.deg = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.reload = 0;
        this.barrelThickness = this.size / 36 * 15;
        this.barrelLength = this.size / 36 * 68;
        this.damaged = false;
        this.alpha = 1;
        this.recoil = 0.06;
        this.health = 100;
        this.damage = 2;
        this.maxHealth = this.health;
        this.isKilled = false;
        this.autoFire=false;
    }
    update() {
        this.lvl = parseInt(Math.sqrt(this.xp) * 0.3);
        this.deg = calcAngle(this.x, this.y, mouseX, mouseY);
        this.size = (1 + this.lvl / 150) * 36;
        this.barrelThickness = this.size / 36 * 15;
        this.barrelLength = this.size / 36 * 68;
        if (this.health < this.maxHealth) {
            this.health += 0.01 * (this.lvl / 2);
        }
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        this.basicReload = 30 - (this.lvl / 3);

        this.vx += this.ax;
        this.vy += this.ay;
        this.vx *= 0.97;
        this.vy *= 0.97;
        this.ax *= 0.92;
        this.ay *= 0.92;

        if (keys['a'] || keys['ArrowLeft']) {
            this.ax -= 0.02;
        }
        if (keys['d'] || keys['ArrowRight']) {
            this.ax += 0.02;
        }
        if (keys['s'] || keys['ArrowDown']) {
            this.ay += 0.02;
        }
        if (keys['w'] || keys['ArrowUp']) {
            this.ay -= 0.02;
        }
        scroolX -= this.vx;
        scroolY -= this.vy;
        this.x = centerX + this.vx * 10;
        this.y = centerY + this.vy * 10;
        if (Math.abs(scroolX - (this.x - centerX)) > roomSize / 2 && this.alpha === 1) {
            scroolX += this.vx;
            this.ax *= -1.1;
        }
        if (Math.abs(scroolY - (this.y - centerY)) > roomSize / 2 && this.alpha === 1) {
            scroolY += this.vy;
            this.ay *= -1.1;
        }
        this.damaged = false;
        for (let i = 0; i < polygons.length; i++) {
            const checked = checkCollision(this.x, this.y, this.size, polygons[i].x2, polygons[i].y2, polygons[i].size);
            if (checked.check && this.alpha === 1 && polygons[i].alpha === 1) {
                this.vx -= checked.dx * 0.2;
                this.vy -= checked.dy * 0.2;
                polygons[i].vx += checked.dx * 800 / (polygons[i].size ** 2);
                polygons[i].vy += checked.dy * 800 / (polygons[i].size ** 2);
                this.damaged = true;
                polygons[i].damaged = true;
                polygons[i].health -= this.damage;
                this.health -= polygons[i].damage;
                if (this.health < 0 && !this.isKilled) {
                    switch (polygons[i].sides) {
                        case 4:
                            this.enemy = "Square";
                            break;

                        case 3:
                            this.enemy = "Triangle";
                            break;

                        case 5:
                            this.enemy = "Pentagon";
                            break;

                        case 50:
                            this.enemy = "Alpha Pentagon";
                            break;
                        case 2:
                            this.enemy = "Line";
                            break;
                        case 1000:
                            this.enemy = "Circle";
                            break;
                        case 14:
                            this.enemy = "Tetradecagon";
                            break;
                    }
                    this.isKilled = true;
                }
            }
        }
        if (this.health < 0) {
            const newSA = killed(this.size, this.alpha);
            this.size = newSA.size;
            this.alpha = newSA.alpha;
        }


        this.reload -= 1;
        if ((mouseDown||this.autoFire) && this.reload < 0 && this.alpha === 1) {
            bullets.push(new Bullet(this.x, this.y, this.deg, this.size / 36, this.barrelLength));
            this.ax -= Math.cos(this.deg) * this.recoil;
            this.ay -= Math.sin(this.deg) * this.recoil;
            this.reload = this.basicReload;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(this.deg + Math.PI / 2) * this.barrelThickness, this.y + Math.sin(this.deg + Math.PI / 2) * this.barrelThickness);
        ctx.lineTo(this.x + Math.cos(this.deg + Math.PI / 2) * this.barrelThickness + Math.cos(this.deg) * this.barrelLength, this.y + Math.sin(this.deg + Math.PI / 2) * this.barrelThickness + Math.sin(this.deg) * this.barrelLength);
        ctx.lineTo(this.x - Math.cos(this.deg + Math.PI / 2) * this.barrelThickness + Math.cos(this.deg) * this.barrelLength, this.y - Math.sin(this.deg + Math.PI / 2) * this.barrelThickness + Math.sin(this.deg) * this.barrelLength);
        ctx.lineTo(this.x - Math.cos(this.deg + Math.PI / 2) * this.barrelThickness, this.y - Math.sin(this.deg + Math.PI / 2) * this.barrelThickness);

        ctx.fillStyle = `rgba(153, 153, 153, ${this.alpha}`;
        damaged(this.damaged, this.alpha);
        ctx.fill();
        border(this.alpha);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
        ctx.fillStyle = `rgba(0, 178, 225, ${this.alpha}`;
        damaged(this.damaged, this.alpha);
        ctx.fill();
        border(this.alpha);
        healthBar(this.x, this.y - 25, this.size * 2, this.health, this.maxHealth, this.alpha);
    }
}

class Bullet {
    constructor(x, y, deg, size, launchPosition) {
        this.deg = deg + Math.PI * (Math.random() * 0.05 - 0.025);
        this.x = x + Math.cos(this.deg) * launchPosition;
        this.y = y + Math.sin(this.deg) * launchPosition;
        this.ax = Math.cos(this.deg) * 0.22 * (1 + basic.lvl / 70) + Math.random() * 0.05 - 0.025;
        this.ay = Math.sin(this.deg) * 0.22 * (1 + basic.lvl / 70) + Math.random() * 0.05 - 0.025;
        this.vx = Math.cos(this.deg) * 10 * (1 + basic.lvl / 70);
        this.vy = Math.sin(this.deg) * 10 * (1 + basic.lvl / 70);
        this.size = size * 16;
        this.launchX = scroolX;
        this.launchY = scroolY;
        this.disappear = 180;
        this.damaged = false;
        this.alpha = 1;
        this.health = 5 + basic.lvl / 1.5;
        this.damage = 2 + basic.lvl / 7;
        this.maxHealth = this.health;
    }
    update() {
        this.vx += this.ax;
        this.vx *= 0.96;
        this.x += this.vx;
        this.x2 = this.x - this.launchX + scroolX;

        this.vy += this.ay;
        this.vy *= 0.96;
        this.y += this.vy;
        this.y2 = this.y - this.launchY + scroolY;

        this.damaged = false;
        for (let i = 0; i < polygons.length; i++) {
            const checked = checkCollision(this.x2, this.y2, this.size, polygons[i].x2, polygons[i].y2, polygons[i].size);
            if (checked.check && this.alpha === 1 && polygons[i].alpha === 1) {
                this.vx -= checked.dx * 800 / (polygons[i].size ** 2);
                this.vy -= checked.dy * 800 / (polygons[i].size ** 2);
                polygons[i].vx += checked.dx * 400 / (polygons[i].size ** 2);
                polygons[i].vy += checked.dy * 400 / (polygons[i].size ** 2);
                this.damaged = true;
                polygons[i].damaged = true;
                polygons[i].health -= this.damage;
                this.health -= polygons[i].damage;
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x2, this.y2, this.size, 0, Math.PI * 2, true);
        ctx.fillStyle = `rgba(0, 178, 225, ${this.alpha})`;
        this.disappear -= 1;
        if (this.disappear <= 0 || this.health < 0) {
            const newSA = killed(this.size, this.alpha);
            this.size = newSA.size;
            this.alpha = newSA.alpha;
        }
        damaged(this.damaged, this.alpha);
        ctx.fill();
        border(this.alpha);
    }
}

class DeadMsg {
    constructor() {
        this.y = -500;
    }
    update() {
        this.enemy = basic.enemy;
        this.score = basic.xp;
        this.lvl = basic.lvl;
        if (basic.alpha !== 1) {
            this.y += (centerY - this.y) / 15;
            this.x = centerX;
        }
    }
    draw() {
        if (basic.alpha !== 1) {
            ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            text("you were killed by:", this.x, this.y - 160, 20)
            text(this.enemy, this.x, this.y - 114, 30)

            text("Score:", this.x - 42, this.y - 10, 24)
            text(this.score, this.x + 10, this.y - 10, 36, true)

            text("Level:", this.x - 42, this.y + 60, 24)

            text(this.lvl+1, this.x + 10, this.y + 60, 36, true)
        }
    }
}




canvas.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX - canvas.getBoundingClientRect().left) * window.devicePixelRatio;
    mouseY = (event.clientY - canvas.getBoundingClientRect().top) * window.devicePixelRatio;
});

canvas.addEventListener('mousedown', (event) => {
    mouseDown = true;
});

canvas.addEventListener('mouseup', (event) => {
    mouseDown = false;
});

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

document.addEventListener("keydown", (event) => {
    if (event.key === "e") {
        basic.autoFire = !basic.autoFire;
    }
});







const basic = new Basic(1);
const deadMsg = new DeadMsg();





function calcAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}


function border(alpha) {
    let red = parseInt(ctx.fillStyle.slice(1, 3), 16);
    let green = parseInt(ctx.fillStyle.slice(3, 5), 16);
    let blue = parseInt(ctx.fillStyle.slice(5, 7), 16);
    if (alpha !== 1) {
        const rgbaMatch = ctx.fillStyle.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (rgbaMatch) {
            red = parseInt(rgbaMatch[1]);
            green = parseInt(rgbaMatch[2]);
            blue = parseInt(rgbaMatch[3]);
            alpha = parseFloat(rgbaMatch[4]);
        }
    }

    const newRed = Math.round(red * 0.75);
    const newGreen = Math.round(green * 0.75);
    const newBlue = Math.round(blue * 0.75);

    ctx.strokeStyle = `rgba(${newRed}, ${newGreen}, ${newBlue}, ${alpha})`;
    ctx.lineWidth = 5.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
}

function healthBar(x, y, length, health, maxHealth, alpha) {
    if (health !== maxHealth) {
        ctx.strokeStyle = `rgba(85, 85, 85, ${alpha}`;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - length / 2, y + length * 1.2);
        ctx.lineTo(x + length / 2, y + length * 1.2);
        ctx.stroke();
        if (health > 0) {
            ctx.strokeStyle = `rgba(133, 227, 125, ${alpha}`;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(x - length / 2, y + length * 1.2);
            ctx.lineTo(x - length / 2 + length * (health / maxHealth), y + length * 1.2);
            ctx.stroke();
        }
    }
}

function text(text, x, y, size, left) {
    const textBorder = 4;
    ctx.textAlign = left ? "left" : "center";
    ctx.strokeStyle = "#222222";
    ctx.font = `bold ${size}px Ubuntu, sans-serif`;
    ctx.lineWidth = textBorder * (size / 24);
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#eeeeee";
    ctx.font = `bold ${size}px Ubuntu, sans-serif`;
    ctx.fillText(text, x, y);
}

function drawText() {
    // text(`xp: ${basic.xp}`, centerX, canvas.height - 250, 30);
    text(`lvl ${basic.lvl + 1} Tank`, centerX, canvas.height - 120, 50);
}

function damaged(damaged, alpha) {
    if (damaged) {
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha}` : `rgba(255, 0, 0, ${alpha}`;
    }
}

function killed(inputSize, inputAlpha) {
    return {
        size: inputSize *= 1.06,
        alpha: inputAlpha -= 0.1
    }
}

function checkCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy)
    return {
        check: dist <= r1 + r2,
        dx: dx / dist,
        dy: dy / dist
    }
}



window.onresize = function () {
    resize();
}

function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}










function mainUpdate() {
    resize();
    for (let i = polygons.length; i < shapeCount * (roomSize - roomBorder * 2); i++) {
        polygons.push(new Polygon(roomBorder + Math.random() * (roomSize - roomBorder * 2), roomBorder + Math.random() * (roomSize - roomBorder * 2)));
    }
    for (let i = 0; i < polygons.length; i++) {
        polygons[i].update();
        if (polygons[i].alpha < 0) {
            polygons.splice(i, 1);
            i--;
        }
    }
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].update();
        if (bullets[i].alpha < 0) {
            bullets.splice(i, 1);
            i--;
        }
    }
    basic.update();
    deadMsg.update();
}


function mainDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(184, 184, 184, 1)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(205, 205, 205, 1)`;
    ctx.fillRect(centerX - (roomSize - roomBorder * 2) / 2 + scroolX, centerY - (roomSize - roomBorder * 2) / 2 + scroolY, (roomSize - roomBorder * 2), (roomSize - roomBorder * 2));


    for (let i = 0; i < polygons.length; i++) {
        polygons[i].draw();
    }
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].draw();
    }
    basic.draw();
    drawText();
    deadMsg.draw();
}















function mainloop() {
    let currentTime = Date.now();
    let updated = false;
    while (currentTime - prevTime > targetInterval * 0.5) {
        mainUpdate();
        updated = true;
        prevTime += targetInterval;
        const now = Date.now();
        const updateTime = now - currentTime;
        if (updateTime > targetInterval * UPDATE_LOAD_COEFF) {
            if (prevTime < now - targetInterval) {
                prevTime = now - targetInterval;
            }
            break;
        }
    }
    if (updated) {
        mainDraw();
    }
    requestAnimationFrame(mainloop);
}

mainloop();


