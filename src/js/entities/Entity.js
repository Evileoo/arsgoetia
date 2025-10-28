// Classe de base pour toutes les entités (sauf le joueur)
// Attributs principaux : hp, size {x,y}, model {shape, color}, speed, collision
class Entity {
    /**
     * x,y are world coordinates (center of the entity)
     * options: { hp, size: {x,y}, model: {shape, color}, speed, collision }
     */
    constructor(x = 0, y = 0, options = {}) {
        this.x = x;
        this.y = y;
        this.isProjectile = false; // true pour les projectiles (règles collision spéciales)

        this.hp = options.hp ?? 10;
        this.size = options.size ?? { x: 16, y: 16 };
        this.model = options.model ?? { shape: 'rect', color: '#FFFFFF' };
        this.speed = options.speed ?? 1;
        this.collision = options.collision ?? false;

        this.isAlive = this.hp > 0;
        this.type = 'Entity';
    }

    // Retourne les bounds en coordonnées monde (AABB) en considérant x,y comme centre
    getBounds() {
        return {
            x: this.x - this.size.x / 2,
            y: this.y - this.size.y / 2,
            w: this.size.x,
            h: this.size.y
        };
    }

    // Vérifie collision AABB simple avec une autre entité
    isCollidingWith(other) {
        // Si cette entité n'a pas la collision activée, elle ne participe pas
        if (!this.collision) return false;

        // Règles spéciales pour les projectiles:
        // - Un projectile ne peut toucher que le joueur
        // - Les projectiles ne se cognent pas entre eux
        if (this.isProjectile) {
            if (other.isProjectile) return false; // pas de collision entre projectiles
            if (!other.type?.includes('Player')) return false; // uniquement collision avec joueur
        }
        if (other.isProjectile) {
            if (!this.type?.includes('Player')) return false;
        }
        const a = this.getBounds();
        const b = other.getBounds();
        // Utilise <= pour considérer comme non-colliding quand les bords se touchent
        return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
    }

    // Calcule le vecteur de pénétration minimal (MTV) pour séparer cette entité de `other`.
    // Retourne null si pas de collision, ou {dx, dy} représentant le déplacement à appliquer
    // à `this` pour qu'il ne soit plus en collision.
    getOverlap(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapX > 0 && overlapY > 0) {
            // Choisit la direction de séparation la plus courte
            if (overlapX < overlapY) {
                // Sépare sur X
                const dir = (a.x + a.w / 2) < (b.x + b.w / 2) ? -1 : 1;
                return { dx: overlapX * dir, dy: 0 };
            } else {
                // Sépare sur Y
                const dir = (a.y + a.h / 2) < (b.y + b.h / 2) ? -1 : 1;
                return { dx: 0, dy: overlapY * dir };
            }
        }
        return null;
    }

    // Résout la collision en déplaçant `this` par le vecteur de pénétration minimal.
    // Retourne true si une résolution a eu lieu.
    resolveCollisionWith(other) {
        const ov = this.getOverlap(other);
        if (!ov) return false;
        // Si la direction est nulle (coïncidence totale), applique un petit décalage aléatoire
        if (ov.dx === 0 && ov.dy === 0) {
            const a = Math.random() < 0.5 ? -1 : 1;
            this.x += a * 1;
            this.y += a * 1;
        } else {
            this.x += ov.dx;
            this.y += ov.dy;
        }
        return true;
    }

    // Inflige des dégâts
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
            this.onDeath();
        }
    }

    // Hook appelé à la mort (peut être surchargé)
    onDeath() {
        // placeholder
    }

    // Update basique (à surcharger). target peut être un objet {x,y}.
    update(target) {
        // comportement par défaut : rien
    }

    // Rend l'entité en coordonnées écran en utilisant offsetX/offsetY (comme dans Game)
    render(ctx, offsetX = 0, offsetY = 0) {
        const screenX = Math.round(this.x + offsetX);
        const screenY = Math.round(this.y + offsetY);

        ctx.save();
        ctx.fillStyle = this.model.color ?? '#FFFFFF';

        if (this.model.shape === 'circle') {
            const radius = Math.max(this.size.x, this.size.y) / 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // rect (x,y are center)
            ctx.fillRect(
                Math.round(screenX - this.size.x / 2),
                Math.round(screenY - this.size.y / 2),
                Math.round(this.size.x),
                Math.round(this.size.y)
            );
        }

        ctx.restore();
    }
}

// NOTE: Ce fichier définit `Entity` dans le scope global pour s'intégrer avec le loader actuel
