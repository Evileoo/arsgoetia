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

    init() {
        this.world = new WorldGenerator(32); // Taille des tuiles de 32px
        this.player = new Player(0, 0); // Le joueur commence à la position 0,0
    }

    update() {
        this.player.update();
        
        // Calcul de l'offset pour le rendu du monde
        this.offsetX = this.canvas.width / 2 - this.player.x;
        this.offsetY = this.canvas.height / 2 - this.player.y;

        // Nettoyage des tuiles trop éloignées
        this.world.cleanupTiles(this.player.x, this.player.y, this.canvas.width, this.canvas.height);
    }

    render() {
        // Effacement du canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rendu du monde
        this.world.render(this.ctx, this.offsetX, this.offsetY, this.canvas.width, this.canvas.height);

        // Rendu du joueur
        this.player.render(this.ctx, this.canvas.width, this.canvas.height);

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