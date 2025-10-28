class Player {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.slowTimer = 0; // frames remaining during which movement is slowed
        this.collision = true; // le joueur participe aux collisions
        this.setupControls();
    }

    setupControls() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'z':
                case 'arrowup':
                case 'w':
                    this.keys.up = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.down = true;
                    break;
                case 'q':
                case 'arrowleft':
                case 'a':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'z':
                case 'arrowup':
                case 'w':
                    this.keys.up = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.down = false;
                    break;
                case 'q':
                case 'arrowleft':
                case 'a':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
            }
        });
    }

    update() {
        let dx = 0;
        let dy = 0;
        
        if (this.keys.up) dy -= 1;
        if (this.keys.down) dy += 1;
        if (this.keys.left) dx -= 1;
        if (this.keys.right) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const normalizer = 1 / Math.sqrt(2);
            dx *= normalizer;
            dy *= normalizer;
        }

        // Applique ralentissement si nécessaire
        const speedMultiplier = this.slowTimer > 0 ? 0.5 : 1.0;
        this.x += dx * this.speed * speedMultiplier;
        this.y += dy * this.speed * speedMultiplier;

        if (this.slowTimer > 0) this.slowTimer--;
    }

    render(ctx, screenWidth, screenHeight) {
        // Player is always centered
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fournit les bounds AABB du joueur en coordonnées monde (x,y centre)
    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            w: this.size,
            h: this.size
        };
    }

    // Retourne le vecteur de mouvement récent (utiliser prev positions provenant de Game)
    getMovementVector(prevX, prevY) {
        return { x: this.x - prevX, y: this.y - prevY };
    }
}