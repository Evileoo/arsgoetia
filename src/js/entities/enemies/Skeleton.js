class Skeleton extends Entity {
    constructor(x = 0, y = 0) {
        super(x, y, {
            hp: 15,
            size: { x: 16, y: 16 }, // comme le zombie
            model: { shape: 'circle', color: '#DCDCDC' }, // gris clair
            speed: 2, // plus lent que le zombie
            collision: true
        });
        this.type = 'Skeleton';
        
        // Distance à laquelle le squelette s'arrête et tire
        this.shootingRange = 200;
        
        // Cooldown de tir
        this.shootCooldownMs = 2000; // tire toutes les 2s
        this.lastShotTime = 0;
    }

    update(target, projectileCallback = null) {
        if (!this.isAlive) return;
        
        if (target && typeof target.x === 'number' && typeof target.y === 'number') {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distToTarget = Math.hypot(dx, dy);

            // Si on est plus loin que la range, on se rapproche
            if (distToTarget > this.shootingRange) {
                const dirX = dx / distToTarget;
                const dirY = dy / distToTarget;
                this.vx = dirX * this.speed;
                this.vy = dirY * this.speed;
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // On est à portée, on arrête de bouger et on tire si possible
                this.vx = 0;
                this.vy = 0;

                // Vérifie si on peut tirer
                const now = Date.now();
                if (now - this.lastShotTime >= this.shootCooldownMs) {
                    if (projectileCallback) {
                        const arrow = new Arrow(this.x, this.y, target.x, target.y);
                        projectileCallback(arrow);
                        this.lastShotTime = now;
                    }
                }
            }
        }
    }

    render(ctx, offsetX = 0, offsetY = 0) {
        // Rendu de base
        super.render(ctx, offsetX, offsetY);

        // Si on est en train de recharger, on peut ajouter un indicateur visuel
        const now = Date.now();
        const cooldownProgress = Math.min(1, (now - this.lastShotTime) / this.shootCooldownMs);
        
        if (cooldownProgress < 1) {
            const screenX = Math.round(this.x + offsetX);
            const screenY = Math.round(this.y + offsetY);
            const radius = this.size.x / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius + 4, 0, Math.PI * 2 * cooldownProgress);
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}