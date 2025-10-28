// Gestion de la navigation
document.addEventListener('DOMContentLoaded', () => {
    // Éléments de l'interface
    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const playBtn = document.getElementById('play-btn');
    
    // Gestionnaire pour le bouton jouer
    playBtn.addEventListener('click', () => {
        homeScreen.classList.remove('active');
        homeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active');
        // Démarre une nouvelle partie
        new Game();
    });
});

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.isPaused = false;
        this.isResuming = false;
        this.resumeCountdown = 0;
        this.init();
        
        // Éléments de l'interface de pause
        this.pauseScreen = document.getElementById('pause-screen');
        this.resumeBtn = document.getElementById('resume-btn');
        this.quitBtn = document.getElementById('quit-btn');
        this.setupPauseHandlers();

        window.addEventListener('resize', () => this.resizeCanvas());
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Retourne des coordonnées hors écran (aléatoire sur un des 4 côtés)
    getOffscreenCoords(margin = 50, extra = 200) {
        const halfW = this.canvas.width / 2;
        const halfH = this.canvas.height / 2;
        const side = Math.floor(Math.random() * 4); // 0:left,1:right,2:top,3:bottom
        let sx = this.player.x;
        let sy = this.player.y;

        switch (side) {
            case 0: // left
                sx = this.player.x - (halfW + margin + Math.random() * extra);
                sy = this.player.y + (Math.random() - 0.5) * (this.canvas.height + extra);
                break;
            case 1: // right
                sx = this.player.x + (halfW + margin + Math.random() * extra);
                sy = this.player.y + (Math.random() - 0.5) * (this.canvas.height + extra);
                break;
            case 2: // top
                sx = this.player.x + (Math.random() - 0.5) * (this.canvas.width + extra);
                sy = this.player.y - (halfH + margin + Math.random() * extra);
                break;
            case 3: // bottom
                sx = this.player.x + (Math.random() - 0.5) * (this.canvas.width + extra);
                sy = this.player.y + (halfH + margin + Math.random() * extra);
                break;
        }
        return { x: sx, y: sy };
    }

    init() {
        this.world = new WorldGenerator(32); // Taille des tuiles de 32px
        this.player = new Player(0, 0); // Le joueur commence à la position 0,0
        
        // Équipe la compétence de coup d'épée
        this.player.addAutoSkill(new SwordSlash());
        
        // Liste des entités (ennemis, NPCs, etc.)
        this.entities = [];
        // Liste des projectiles actifs
        this.projectiles = [];
        // Spawn manager configuration
        this.spawnIntervalMs = 3000; // toutes les 3s par défaut
        this.lastSpawnTime = Date.now();
        this.maxEntities = Infinity; // cap du nombre d'ennemis simultanés désactivé

        // Spawn initial d'un ennemi en dehors de l'écran
        try {
            const { x: spawnX, y: spawnY } = this.getOffscreenCoords();
            // Choix aléatoire entre Zombie et Skeleton pour le premier ennemi
            const EnemyClass = Math.random() < 0.5 ? Zombie : Skeleton;
            const enemy = new EnemyClass(spawnX, spawnY);
            this.entities.push(enemy);
        } catch (err) {
            // Si les classes d'ennemis ne sont pas chargées, on ignore l'erreur
            console.warn('Impossible de spawn un ennemi:', err);
        }
    }

    update() {
        // Sauvegarde de la position du joueur avant mouvement pour détecter la direction du mouvement
        const prevPlayerX = this.player.x;
        const prevPlayerY = this.player.y;
        this.player.update(this.entities);
        
        // Calcul de l'offset pour le rendu du monde
        this.offsetX = this.canvas.width / 2 - this.player.x;
        this.offsetY = this.canvas.height / 2 - this.player.y;

        // Nettoyage des tuiles trop éloignées
        this.world.cleanupTiles(this.player.x, this.player.y, this.canvas.width, this.canvas.height);
        // Mise à jour des entités : on leur passe la position du joueur comme target
        if (this.entities && this.entities.length) {
            for (let i = this.entities.length - 1; i >= 0; i--) {
                const e = this.entities[i];
                if (!e.isAlive) {
                    // Retire les entités mortes
                    this.entities.splice(i, 1);
                    continue;
                }
                // Passe la fonction d'ajout de projectile aux entités qui peuvent tirer
                e.update(
                    { x: this.player.x, y: this.player.y },
                    (projectile) => this.projectiles.push(projectile)
                );
            }
        }

        // Mise à jour et nettoyage des projectiles
        if (this.projectiles.length) {
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.update();

                // Vérifie collision avec joueur
                if (p.isCollidingWith(this.player)) {
                    // TODO: Appliquer dégâts au joueur
                    this.projectiles.splice(i, 1);
                    continue;
                }

                // Supprime les projectiles sortis de l'écran
                if (p.isOffscreen(this.canvas.width, this.canvas.height, this.offsetX, this.offsetY)) {
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Spawn périodique : crée de nouveaux ennemis hors écran si on a la place
        const now = Date.now();
        if (now - this.lastSpawnTime >= this.spawnIntervalMs && this.entities.length < this.maxEntities) {
            try {
                const pos = this.getOffscreenCoords();
                // Choix aléatoire entre Zombie et Skeleton (50/50)
                const EnemyClass = Math.random() < 0.5 ? Zombie : Skeleton;
                const enemy = new EnemyClass(pos.x, pos.y);
                this.entities.push(enemy);
                this.lastSpawnTime = now;
            } catch (err) {
                console.warn('Erreur lors du spawn périodique:', err);
                this.lastSpawnTime = now; // évite boucle rapide en cas d'erreur
            }
        }

        // Résolution des collisions et comportement push/slow
        if (this.entities && this.entities.length) {
            const playerMove = { x: this.player.x - prevPlayerX, y: this.player.y - prevPlayerY };
            const playerMoveMag = Math.hypot(playerMove.x, playerMove.y) || 0;

            // Entité <-> Joueur : push si l'entité charge, slow si le joueur pousse
            for (const e of this.entities) {
                if (!e.collision) continue;
                if (!e.isCollidingWith(this.player)) continue;

                // vecteur de l'entité vers le joueur
                const vecEx = this.player.x - e.x;
                const vecEy = this.player.y - e.y;
                const distE = Math.hypot(vecEx, vecEy) || 1;
                const vecEnx = vecEx / distE;
                const vecEny = vecEy / distE;

                // vélocité de l'entité cette frame (peut être 0)
                const evx = e.vx ?? 0;
                const evy = e.vy ?? 0;
                const dotE = evx * vecEnx + evy * vecEny;

                // 1) Si l'entité avance vers le joueur (dotE > 0), elle pousse le joueur
                if (dotE > 0.05) {
                    const pushFactor = 1.0; // scalar to tune push strength
                    this.player.x += evx * pushFactor;
                    this.player.y += evy * pushFactor;
                }

                // 2) Si le joueur s'est déplacé vers l'entité, on le ralentit et on annule une partie du mouvement
                if (playerMoveMag > 0.001) {
                    const vecPrevToEntityX = e.x - prevPlayerX;
                    const vecPrevToEntityY = e.y - prevPlayerY;
                    const distPrev = Math.hypot(vecPrevToEntityX, vecPrevToEntityY) || 1;
                    const vecPrevNormX = vecPrevToEntityX / distPrev;
                    const vecPrevNormY = vecPrevToEntityY / distPrev;
                    const playerDirX = playerMove.x / playerMoveMag;
                    const playerDirY = playerMove.y / playerMoveMag;
                    const dotP = playerDirX * vecPrevNormX + playerDirY * vecPrevNormY;
                    if (dotP > 0.2) {
                        // Ralentit le joueur pendant quelques frames
                        this.player.slowTimer = Math.max(this.player.slowTimer, 12);
                        // Annule une partie du déplacement (empêche de traverser l'entité)
                        this.player.x = prevPlayerX + playerMove.x * 0.5;
                        this.player.y = prevPlayerY + playerMove.y * 0.5;
                    }
                }

                // Si après push/slow il reste un recouvrement important, tente de séparer en déplaçant
                // l'entité légèrement (préserve l'idée que l'entité a collision true)
                if (e.isCollidingWith(this.player)) {
                    const ov = e.getOverlap(this.player);
                    if (ov) {
                        // applique la moitié de la séparation à l'entité
                        e.x += ov.dx * 0.5;
                        e.y += ov.dy * 0.5;
                    }
                }
            }

            // Entité vs Entité (on répartit le déplacement entre les deux)
            for (let i = 0; i < this.entities.length; i++) {
                for (let j = i + 1; j < this.entities.length; j++) {
                    const a = this.entities[i];
                    const b = this.entities[j];
                    if (!a.collision || !b.collision) continue;
                    if (a.isCollidingWith(b)) {
                        const ov = a.getOverlap(b);
                        if (ov) {
                            const halfX = ov.dx / 2;
                            const halfY = ov.dy / 2;
                            a.x += halfX;
                            a.y += halfY;
                            b.x -= halfX;
                            b.y -= halfY;
                        } else {
                            const rx = (Math.random() - 0.5) * 2;
                            const ry = (Math.random() - 0.5) * 2;
                            a.x += rx;
                            a.y += ry;
                            b.x -= rx;
                            b.y -= ry;
                        }
                    }
                }
            }
        }
    }

    render() {
        // Effacement du canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rendu du monde
        this.world.render(this.ctx, this.offsetX, this.offsetY, this.canvas.width, this.canvas.height);

        // Rendu du joueur
        this.player.render(this.ctx, this.canvas.width, this.canvas.height);

        // Rendu des entités (avec le même offset que le monde)
        if (this.entities && this.entities.length) {
            for (const e of this.entities) {
                e.render(this.ctx, this.offsetX, this.offsetY);
            }
        }

        // Rendu des projectiles
        for (const p of this.projectiles) {
            p.render(this.ctx, this.offsetX, this.offsetY);
        }

        // Affichage du décompte si nécessaire
        if (this.isResuming && this.resumeCountdown > 0) {
            // Récupère le type de biome à la position du joueur
            const tileX = Math.floor(this.player.x / this.world.tileSize);
            const tileY = Math.floor(this.player.y / this.world.tileSize);
            const currentTile = this.world.generateTile(tileX, tileY);
            
            // Détermine si le biome est clair (pour choisir la couleur du texte)
            const isBiomeBright = currentTile.type === 'TUNDRA' || 
                                currentTile.type === 'DESERT' || 
                                currentTile.type === 'OASIS';

            // Configuration du texte
            this.ctx.save();
            this.ctx.font = 'bold 120px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Ajoute une ombre pour améliorer la lisibilité
            this.ctx.shadowColor = isBiomeBright ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
            this.ctx.shadowBlur = 10;
            
            // Choix de la couleur en fonction du biome
            this.ctx.fillStyle = isBiomeBright ? '#000000' : '#FFFFFF';
            
            // Affichage du nombre
            this.ctx.fillText(
                this.resumeCountdown.toString(),
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            
            this.ctx.restore();
        }
    }

    setupPauseHandlers() {
        // Gestion de la touche Échap
        window.addEventListener('keydown', (e) => {
            // Liste des codes possibles pour la touche Échap
            const escCodes = ['Escape', 'Esc', 27];
            if (escCodes.includes(e.key) || escCodes.includes(e.keyCode)) {
                if (!this.isResuming) {
                    this.togglePause();
                }
            }
        });

        // Gestionnaire pour le bouton Reprendre
        this.resumeBtn.addEventListener('click', () => {
            if (!this.isResuming) {
                this.startResumeCountdown();
            }
        });

        // Gestionnaire pour le bouton Abandonner
        this.quitBtn.addEventListener('click', () => {
            this.quitGame();
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.pauseScreen.classList.add('hidden');
        }
    }

    startResumeCountdown() {
        this.isResuming = true;
        this.resumeCountdown = 3;
        this.pauseScreen.classList.add('hidden');
        
        const startTime = Date.now();
        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            this.resumeCountdown = 3 - elapsed;
            
            if (this.resumeCountdown <= 0) {
                this.isPaused = false;
                this.isResuming = false;
                this.resumeCountdown = 0;
                return;
            }
            
            requestAnimationFrame(updateTimer);
        };
        
        requestAnimationFrame(updateTimer);
    }

    quitGame() {
        // Retour à l'écran d'accueil
        const homeScreen = document.getElementById('home-screen');
        const gameScreen = document.getElementById('game-screen');
        
        homeScreen.classList.remove('hidden');
        homeScreen.classList.add('active');
        gameScreen.classList.remove('active');
        gameScreen.classList.add('hidden');
        
        // Réinitialisation de l'état de pause
        this.isPaused = false;
        this.pauseScreen.classList.add('hidden');
    }

    gameLoop() {
        // On met à jour le jeu uniquement si on n'est pas en pause et pas en phase de reprise
        if (!this.isPaused && !this.isResuming) {
            this.update();
        }
        // On rend toujours la scène pour afficher au moins le timer
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}