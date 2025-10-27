class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.init();
        
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
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Démarrage du jeu quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});