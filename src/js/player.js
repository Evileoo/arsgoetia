class Player {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.slowTimer = 0; // frames remaining during which movement is slowed
        this.collision = true; // le joueur participe aux collisions
        this.lastMoveX = 0; // pour connaître la dernière direction
        this.lastMoveY = -1; // vers le haut par défaut
        this.autoSkills = []; // liste des compétences automatiques
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

    update(entities = []) {
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

        // Met à jour la dernière direction si on se déplace
        if (dx !== 0 || dy !== 0) {
            this.lastMoveX = dx;
            this.lastMoveY = dy;
        }

        if (this.slowTimer > 0) this.slowTimer--;

        // Mise à jour des compétences automatiques
        for (const skill of this.autoSkills) {
            skill.update(entities);
        }
    }

    render(ctx, screenWidth, screenHeight) {
        // Player is always centered
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        // Render skills first (under player)
        for (const skill of this.autoSkills) {
            skill.render(ctx, centerX - this.x, centerY - this.y);
        }

        // Render player
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

    // Ajoute une compétence automatique
    addAutoSkill(skill) {
        skill.setOwner(this);
        this.autoSkills.push(skill);
    }

    // Retourne l'angle vers lequel le joueur fait face (basé sur son dernier mouvement)
    getFacingAngle() {
        return Math.atan2(this.lastMoveY, this.lastMoveX);
    }
}