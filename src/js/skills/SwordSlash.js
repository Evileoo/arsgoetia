class SwordSlash extends AutoSkill {
    constructor() {
        super({
            name: 'Coup d\'épée',
            cooldownMs: 800
        });

        // Parameters
        this.range = 80;
        this.coneWidth = (Math.PI * 5) / 9; // ~100°
        this.mainDamage = 12;
        this.splashDamage = 6;

        // Animation
        this.isAnimating = false;
        this.animationDurationMs = 300;
        this.animationStartTime = 0;
        this.attackAngle = 0;
        this.particleCount = 3;
        this.lastHit = false; // whether the last execute had at least one target
        this.hitDistance = 0; // distance to first hit target when applicable
    }

    // Find closest enemy (any alive non-projectile entity)
    findClosestEnemy(entities) {
        if (!this.owner) return null;
        let closest = null;
        let minDist = Infinity;
        for (const e of entities) {
            if (!e.isAlive || e.isProjectile) continue;
            const d = Math.hypot(e.x - this.owner.x, e.y - this.owner.y);
            if (d < minDist) {
                minDist = d;
                closest = e;
            }
        }
        return closest;
    }

    // Find targets inside cone using stored attackAngle
    findTargets(entities) {
        if (!this.owner) return [];
        return super.findTargets(entities)
            .filter(e => {
                const dist = Math.hypot(e.x - this.owner.x, e.y - this.owner.y);
                return dist <= this.range && this.isInCone(e.x, e.y, this.attackAngle, this.coneWidth);
            })
            .sort((a, b) => {
                const da = Math.hypot(a.x - this.owner.x, a.y - this.owner.y);
                const db = Math.hypot(b.x - this.owner.x, b.y - this.owner.y);
                return da - db;
            });
    }

    // Execute: always animate; compute attackAngle from nearest enemy or fallback to facing
    execute(entities) {
        const closest = this.findClosestEnemy(entities);
        if (closest) {
            this.attackAngle = Math.atan2(closest.y - this.owner.y, closest.x - this.owner.x);
        } else {
            this.attackAngle = this.owner.getFacingAngle();
        }

        // start animation
        this.isAnimating = true;
        this.animationStartTime = Date.now();

        // apply damage to targets if any
        const targets = this.findTargets(entities);
        if (targets.length > 0) {
            targets[0].takeDamage(this.mainDamage);
            for (let i = 1; i < targets.length; i++) targets[i].takeDamage(this.splashDamage);
            // mark hit and store distance to first target for visual
            this.lastHit = true;
            this.hitDistance = Math.min(this.range, Math.hypot(targets[0].x - this.owner.x, targets[0].y - this.owner.y));
        } else {
            this.lastHit = false;
            this.hitDistance = 0;
        }
    }

    // easing
    easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    // Render a single rotating arc that progresses over time
    render(ctx, offsetX = 0, offsetY = 0) {
        if (!this.owner || !this.isAnimating) return;
        const elapsed = Date.now() - this.animationStartTime;
        if (elapsed >= this.animationDurationMs) {
            this.isAnimating = false;
            return;
        }

        let progress = elapsed / this.animationDurationMs;
        progress = Math.max(0, Math.min(1, progress));
        const eased = this.easeInOutSine(progress);

        const screenX = Math.round(this.owner.x + offsetX);
        const screenY = Math.round(this.owner.y + offsetY);

        const swingAngle = this.coneWidth; // use coneWidth for visual swing
        const startOffset = -swingAngle / 2;
        const arcEnd = startOffset + swingAngle * eased;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.attackAngle);

    // compute current blade angle relative to attackAngle
    const currentBladeAngle = startOffset + swingAngle * eased;
    ctx.rotate(currentBladeAngle);
        const bladeLength = this.range;

        // halo
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bladeLength, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // blade
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bladeLength, 0);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // tip particles
        for (let i = 0; i < this.particleCount; i++) {
            const pr = (1 - eased) * (4 + i * 1.2);
            ctx.beginPath();
            ctx.arc(bladeLength, 0, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.14 * (1 - i / this.particleCount)})`;
            ctx.fill();
        }

        // impact flash if we hit a target
        if (this.lastHit) {
            // Show flash near the time when the blade is at the end of its swing
            const flashStart = 0.55; // eased progress where flash begins
            const flashEnd = 0.95; // where it fades out
            let flashProgress = 0;
            if (eased >= flashStart) {
                flashProgress = (eased - flashStart) / Math.max(0.0001, (flashEnd - flashStart));
                flashProgress = Math.max(0, Math.min(1, flashProgress));
            }

            if (flashProgress > 0) {
                const impactX = (this.hitDistance / this.range) * bladeLength; // position along blade
                const radius = 6 + 18 * flashProgress;
                const alpha = 0.6 * (1 - flashProgress);

                ctx.beginPath();
                ctx.arc(impactX, 0, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,240,200,${alpha})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(impactX, 0, radius * 1.2, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,240,200,${alpha * 0.6})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}
