// Zombie enemy extending Entity
// Caractéristiques demandées : 20hp, un peu plus petit que le joueur, couleur rouge foncé,
// plus lent que le joueur, collision activée.
class Zombie extends Entity {
    constructor(x = 0, y = 0) {
        super(x, y, {
            hp: 20,
            size: { x: 16, y: 16 }, // joueur = 20 => zombie plus petit
            model: { shape: 'circle', color: '#8B0000' }, // dark red
            speed: 3, // plus lent que le joueur (player.speed = 5)
            collision: true
        });
        this.type = 'Zombie';
    }

    // Update simple : si un target {x,y} est fourni, se dirige vers lui.
    update(target) {
        if (!this.isAlive) return;
        if (target && typeof target.x === 'number' && typeof target.y === 'number') {
            let dx = target.x - this.x;
            let dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.5) {
                dx /= dist;
                dy /= dist;
                // stocke la vélocité appliquée cette frame
                this.vx = dx * this.speed;
                this.vy = dy * this.speed;
                this.x += this.vx;
                this.y += this.vy;
                return;
            }
        }
        // Si pas de mouvement, met à zéro la vélocité
        this.vx = 0;
        this.vy = 0;
        // else : on peut étendre le comportement (patrouille, errance, etc.) plus tard
    }

    // Optionnel : réaction à la mort
    onDeath() {
        // placeholder : on pourrait spawn des loot ou jouer une animation
    }
}
