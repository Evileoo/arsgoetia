class WorldGenerator {
    constructor(tileSize = 32) {
        this.tileSize = tileSize;
        this.tiles = new Map();
        this.BIOME_SIZE = 10000; // Distance moyenne entre les centres des biomes
        this.biomePoints = new Map(); // Cache pour les points de contrôle des biomes
        this.POINTS_PER_BIOME = 30; // Nombre de points de contrôle par biome
    }

    // Génère des points de contrôle pour un biome de manière déterministe
    getBiomePoints(cellX, cellY) {
        const key = `${cellX},${cellY}`;
        if (!this.biomePoints.has(key)) {
            const points = [];
            const centerX = (cellX + 0.5) * this.BIOME_SIZE;
            const centerY = (cellY + 0.5) * this.BIOME_SIZE;
            
            // Génère le type de biome de manière déterministe
            const hash = (cellX * 373) ^ (cellY * 977);
            const temperature = (Math.sin(hash * 0.0967) + 1) * 0.5;
            const humidity = (Math.cos(hash * 0.1967) + 1) * 0.5;
            const biomeType = this.getBiomeType(temperature, humidity);

            // Crée des points de contrôle autour du centre avec des angles et distances aléatoires mais déterministes
            for (let i = 0; i < this.POINTS_PER_BIOME; i++) {
                const angle = (hash * (i + 1) * 0.1) % (2 * Math.PI);
                const distance = (this.noise2D(cellX * i, cellY * i) * 0.4 + 0.6) * this.BIOME_SIZE * 0.5;
                points.push({
                    x: centerX + Math.cos(angle) * distance,
                    y: centerY + Math.sin(angle) * distance,
                    type: biomeType
                });
            }
            
            this.biomePoints.set(key, points);
        }
        return this.biomePoints.get(key);
    }

    // Fonction de bruit 2D déterministe simplifiée
    noise2D(x, y, seed = 1234) {
        const dot = x * 12.9898 + y * 78.233 + seed;
        return (Math.sin(dot) * 43758.5453123) % 1;
    }

    // Trouve le point de biome le plus proche
    findNearestBiomePoint(x, y) {
        const cellX = Math.floor(x / this.BIOME_SIZE);
        const cellY = Math.floor(y / this.BIOME_SIZE);
        let nearestPoint = null;
        let minDistance = Infinity;

        // Vérifie les cellules voisines
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                const points = this.getBiomePoints(cellX + offsetX, cellY + offsetY);
                for (const point of points) {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const distance = dx * dx + dy * dy;
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPoint = point;
                    }
                }
            }
        }

        return nearestPoint;
    }

    getTileKey(x, y) {
        return `${Math.floor(x)}:${Math.floor(y)}`;
    }

    getBiomeType(temperature, humidity) {

        // Définition des biomes basée sur la température et l'humidité
        if (temperature < 0.2) {
            return 'TUNDRA';
        } else if (temperature < 0.4) {
            return humidity < 0.5 ? 'TAIGA' : 'COLD_FOREST';
        } else if (temperature < 0.6) {
            if (humidity < 0.3) return 'PLAINS';
            if (humidity < 0.6) return 'FOREST';
            return 'SWAMP';
        } else if (temperature < 0.8) {
            return humidity < 0.3 ? 'SAVANNA' : 'JUNGLE';
        } else {
            return humidity < 0.2 ? 'DESERT' : 'OASIS';
        }
    }

    generateTile(x, y) {
        const key = this.getTileKey(x, y);
        if (!this.tiles.has(key)) {
            const worldX = x * this.tileSize;
            const worldY = y * this.tileSize;
            const nearestPoint = this.findNearestBiomePoint(worldX, worldY);
            
            this.tiles.set(key, {
                type: nearestPoint.type,
                x: x,
                y: y
            });
        }
        return this.tiles.get(key);
    }

    // Convertit une couleur hex en composantes RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Convertit des composantes RGB en couleur hex
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Interpolation bilinéaire pour des transitions douces
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Bruit de Perlin simplifié pour des variations cohérentes
    coherentNoise(x, y, scale = 1.0) {
        const x0 = Math.floor(x * scale);
        const x1 = x0 + 1;
        const y0 = Math.floor(y * scale);
        const y1 = y0 + 1;

        // Obtient les valeurs aux quatre coins
        const c00 = this.noise2D(x0, y0);
        const c10 = this.noise2D(x1, y0);
        const c01 = this.noise2D(x0, y1);
        const c11 = this.noise2D(x1, y1);

        // Position relative dans la cellule
        const fx = (x * scale) - x0;
        const fy = (y * scale) - y0;

        // Interpolation bilinéaire
        const nx0 = this.lerp(c00, c10, fx);
        const nx1 = this.lerp(c01, c11, fx);
        return this.lerp(nx0, nx1, fy);
    }

    // Obtient la couleur de base pour un type de biome
    getBaseBiomeColor(type) {
        switch(type) {
            case 'DESERT': return '#FFE4B5'; // Sable
            case 'OASIS': return '#98FB98'; // Vert clair
            case 'PLAINS': return '#90EE90'; // Vert prairie
            case 'FOREST': return '#228B22'; // Vert forêt
            case 'JUNGLE': return '#156615'; // Vert foncé
            case 'SWAMP': return '#2F4F4F'; // Gris-vert foncé
            case 'TUNDRA': return '#F0F8FF'; // Blanc-bleu
            case 'TAIGA': return '#405A3D'; // Vert-gris
            case 'COLD_FOREST': return '#1B4F1B'; // Vert foncé froid
            case 'SAVANNA': return '#DAA520'; // Jaune-brun
            default: return '#000000';
        }
    }

    // Génère une variation de couleur cohérente pour une tuile spécifique
    getTileColor(type, x, y) {
        const baseColor = this.hexToRgb(this.getBaseBiomeColor(type));
        if (!baseColor) return '#000000';

        // Utilise plusieurs octaves de bruit pour créer des variations plus naturelles
        const scale = 0.05; // Échelle du motif de base
        const noise1 = this.coherentNoise(x, y, scale);
        const noise2 = this.coherentNoise(x, y, scale * 2) * 0.5;
        const noise3 = this.coherentNoise(x, y, scale * 4) * 0.25;
        
        // Combine les différentes octaves de bruit
        const combinedNoise = (noise1 + noise2 + noise3) / 1.75;
        
        // Ajuste l'amplitude des variations en fonction du type de biome
        const variationAmplitude = type === 'DESERT' || type === 'PLAINS' ? 35 : 25;
        const variation = (combinedNoise * 2 - 1) * variationAmplitude;

        // Applique des variations légèrement différentes pour chaque composante
        return this.rgbToHex(
            baseColor.r + variation * 1.0,
            baseColor.g + variation * 0.9,
            baseColor.b + variation * 0.8
        );
    }

    cleanupTiles(centerX, centerY, screenWidth, screenHeight) {
        const maxDistance = Math.max(screenWidth, screenHeight) * 2;
        for (const [key, tile] of this.tiles.entries()) {
            const dx = Math.abs(tile.x * this.tileSize - centerX);
            const dy = Math.abs(tile.y * this.tileSize - centerY);
            if (dx > maxDistance || dy > maxDistance) {
                this.tiles.delete(key);
            }
        }
    }

    render(ctx, offsetX, offsetY, screenWidth, screenHeight) {
        // Désactive l'antialiasing pour éviter les lignes grises
        ctx.imageSmoothingEnabled = false;
        
        const startTileX = Math.floor(-offsetX / this.tileSize) - 1;
        const startTileY = Math.floor(-offsetY / this.tileSize) - 1;
        const endTileX = startTileX + Math.ceil(screenWidth / this.tileSize) + 2;
        const endTileY = startTileY + Math.ceil(screenHeight / this.tileSize) + 2;

        // Dessine les tuiles en une seule fois pour chaque ligne
        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.generateTile(x, y);
                const pixelX = Math.round(x * this.tileSize + offsetX);
                const pixelY = Math.round(y * this.tileSize + offsetY);
                
                ctx.fillStyle = this.getTileColor(tile.type, x, y);
                ctx.fillRect(
                    pixelX,
                    pixelY,
                    this.tileSize + 0.5, // Ajoute un petit chevauchement pour éviter les lignes
                    this.tileSize + 0.5
                );
            }
        }
    }
}