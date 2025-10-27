class Player {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 5;
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
        if (this.keys.up) this.y -= this.speed;
        if (this.keys.down) this.y += this.speed;
        if (this.keys.left) this.x -= this.speed;
        if (this.keys.right) this.x += this.speed;
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
}