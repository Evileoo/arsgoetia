class Arrow extends Entity {
    constructor(x = 0, y = 0, targetX = 0, targetY = 0, speed = 8) {
        super(x, y, {
            size: { x: 8, y: 2 }, // flèche fine
            model: { shape: 'rect', color: '#A0A0A0' }, // gris métallique
            speed: speed,
            collision: true
        });
        
        this.isProjectile = true; // flag spécial pour collision
        this.type = 'Arrow';

        // Calcule et stocke la direction normalisée vers la cible
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy);
        this.dirX = dx / dist;
        this.dirY = dy / dist;

        // Rotation pour le rendu (angle de la flèche)
        this.angle = Math.atan2(dy, dx);
    }

    update() {
        // Mouvement linéaire dans la direction calculée au spawn
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;

        // Stocke la vélocité pour push effects si besoin
        this.vx = this.dirX * this.speed;
        this.vy = this.dirY * this.speed;
    }

    render(ctx, offsetX = 0, offsetY = 0) {
        const screenX = Math.round(this.x + offsetX);
        const screenY = Math.round(this.y + offsetY);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Corps de la flèche
        ctx.fillStyle = this.model.color;
        ctx.fillRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

        // Pointe de flèche (triangle)
        const tipSize = 4;
        ctx.beginPath();
        ctx.moveTo(this.size.x/2, 0);
        ctx.lineTo(this.size.x/2 - tipSize, -tipSize);
        ctx.lineTo(this.size.x/2 - tipSize, tipSize);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Helper: vérifie si la flèche est hors de la zone visible
    isOffscreen(viewWidth, viewHeight, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const margin = 50; // petit extra pour être sûr
        return (
            screenX < -margin ||
            screenY < -margin ||
            screenX > viewWidth + margin ||
            screenY > viewHeight + margin
        );
    }
}