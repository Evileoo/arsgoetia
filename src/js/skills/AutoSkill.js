class AutoSkill {
    constructor(config = {}) {
        this.name = config.name || 'Auto Skill';
        this.cooldownMs = config.cooldownMs || 1000;
        this.lastUsedTime = 0;
        this.owner = null; // référence au propriétaire de la compétence (le joueur)
    }

    setOwner(owner) {
        this.owner = owner;
    }

    canUse() {
        return Date.now() - this.lastUsedTime >= this.cooldownMs;
    }

    // Cette méthode sera appelée chaque frame pour vérifier si on peut utiliser la compétence
    update(entities) {
        if (!this.owner || !this.canUse()) return;
        
        // On exécute la compétence sans vérifier s'il y a des cibles
        this.execute(entities);
        this.lastUsedTime = Date.now();
    }

    // À surcharger : trouve les cibles potentielles
    findTargets(entities) {
        return entities.filter(e => e.isAlive && !e.isProjectile);
    }

    // À surcharger : exécute l'effet de la compétence
    execute(entities) {
        // Les classes filles doivent implémenter cette méthode
    }

    // Helper : calcule l'angle entre deux points
    getAngleTo(targetX, targetY) {
        if (!this.owner) return 0;
        const dx = targetX - this.owner.x;
        const dy = targetY - this.owner.y;
        return Math.atan2(dy, dx);
    }

    // Helper : vérifie si un point est dans un cône
    isInCone(x, y, coneAngle, coneWidth) {
        if (!this.owner) return false;
        
        // Distance au joueur
        const dx = x - this.owner.x;
        const dy = y - this.owner.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return false;

        // Angle vers la cible
        const targetAngle = Math.atan2(dy, dx);
        
        // Différence d'angle (normalisée entre -PI et PI)
        let angleDiff = targetAngle - coneAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // La cible est dans le cône si l'angle est inférieur à la moitié de la largeur
        return Math.abs(angleDiff) <= coneWidth / 2;
    }

    // Optionnel : rendu visuel pour debug/feedback
    render(ctx, offsetX = 0, offsetY = 0) {
        // Par défaut ne fait rien, à surcharger si besoin
    }
}