class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 220; // pixels per second
        this.gravity = 1800; // pixels per second^2
        this.jumpSpeed = 520; // pixels per second
        this.onGround = false;
    }

    draw(ctx, camera) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }

    update(keys, dt) {
        // Horizontal input
        let moveDir = 0;
        if (keys.KeyA) moveDir -= 1;
        if (keys.KeyD) moveDir += 1;
        this.velocityX = moveDir * this.speed;

        // Gravity
        this.velocityY += this.gravity * dt;

        // Jump
        if (keys.KeyW && this.onGround) {
            this.velocityY = -this.jumpSpeed;
            this.onGround = false;
        }
    }

    handleCollision(dt) {
        this.onGround = false;

        // Horizontal move and resolve
        this.x += this.velocityX * dt;
        let epsilon = 0.001;
        let left = Math.floor(this.x / TILE_SIZE);
        let right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        let top = Math.floor(this.y / TILE_SIZE);
        let bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (ty >= 0 && ty < WORLD_HEIGHT && getTile(tx, ty) !== 0) {
                    if (this.velocityX > 0) {
                        this.x = tx * TILE_SIZE - this.width - epsilon;
                    } else if (this.velocityX < 0) {
                        this.x = (tx + 1) * TILE_SIZE + epsilon;
                    }
                    this.velocityX = 0;
                    // Recompute bounds after resolve
                    left = Math.floor(this.x / TILE_SIZE);
                    right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
                }
            }
        }

        // Vertical move and resolve
        this.y += this.velocityY * dt;
        left = Math.floor(this.x / TILE_SIZE);
        right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        top = Math.floor(this.y / TILE_SIZE);
        bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (ty >= 0 && ty < WORLD_HEIGHT && getTile(tx, ty) !== 0) {
                    if (this.velocityY > 0) {
                        this.y = ty * TILE_SIZE - this.height - epsilon;
                        this.onGround = true;
                    } else if (this.velocityY < 0) {
                        this.y = (ty + 1) * TILE_SIZE + epsilon;
                    }
                    this.velocityY = 0;
                    // Recompute bounds after resolve
                    top = Math.floor(this.y / TILE_SIZE);
                    bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);
                }
            }
        }
    }
}
