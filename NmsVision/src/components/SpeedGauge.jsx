import React, { useEffect, useRef } from 'react';

const SpeedGauge = ({ value, color = '#10b981', label = 'Mbps' }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 135;

        // Colors based on theme
        const glowColor = color;

        const drawGauge = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // --- 0. BACKGROUND RADIAL GRADIENT (3D BOWL EFFECT) ---
            const bowlGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, radius + 50);
            bowlGrad.addColorStop(0, '#0f172a');
            bowlGrad.addColorStop(0.8, '#020617');
            bowlGrad.addColorStop(1, '#000000');
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 40, 0, Math.PI * 2);
            ctx.fillStyle = bowlGrad;
            ctx.fill();

            // --- 1. MINIMAL RINGS ---
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 15, Math.PI * 0.75, Math.PI * 2.25);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.stroke();

            // --- 2. THE GROOVE (TRACK) ---
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.8, Math.PI * 2.2);
            ctx.lineWidth = 26;
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
            ctx.lineCap = 'round';
            ctx.stroke();

            // --- 3. SCALE MARKINGS & NUMBERS ---
            const scalePoints = [0, 5, 10, 50, 100, 250, 500, 750, 1000];
            const totalSteps = scalePoints.length - 1;
            
            for (let i = 0; i < scalePoints.length; i++) {
                const angle = Math.PI * 0.8 + (Math.PI * 1.4 * i / totalSteps);
                
                // Tick lines
                ctx.beginPath();
                const inner = radius - 14;
                const outer = radius - 35;
                ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
                ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.stroke();

                // Numbers (Minimized & Positioned outside to avoid overlap)
                const nRadius = radius - 55;
                const nx = centerX + Math.cos(angle) * nRadius;
                const ny = centerY + Math.sin(angle) * nRadius;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '600 11px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(scalePoints[i].toString(), nx, ny);
            }

            // --- 4. PROGRESS MAPPING ---
            const getAngle = (val) => {
                const max = 1000;
                let norm = 0;
                if (val <= 100) norm = (val / 100) * 0.55;
                else norm = 0.55 + ((val - 100) / (max - 100)) * 0.45;
                return Math.PI * 0.8 + (Math.PI * 1.4 * Math.min(norm, 1));
            };

            const progressAngle = getAngle(value);

            // --- 5. PROGRESS ARCS ---
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.8, progressAngle);
            ctx.lineWidth = 26;
            ctx.shadowBlur = 20;
            ctx.shadowColor = glowColor;
            
            const coreGrad = ctx.createLinearGradient(centerX - radius, 0, centerX + radius, 0);
            coreGrad.addColorStop(0, glowColor + '22');
            coreGrad.addColorStop(1, glowColor);
            
            ctx.strokeStyle = coreGrad;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

            // --- 6. PRECISION NEEDLE ---
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(progressAngle);

            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;

            // Simple sharp tapered needle
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(radius - 15, 0);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'white';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Tip point
            ctx.beginPath();
            ctx.arc(radius - 12, 0, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();

            ctx.restore();

            // --- 7. CENTER CAP ---
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // --- 8. MINIMIZED TYPOGRAPHY ---
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Value (Minimized)
            ctx.fillStyle = 'white';
            ctx.font = '800 3.2rem "Inter", sans-serif';
            ctx.fillText(value.toFixed(1), centerX, centerY + 65);

            // Mbps Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '600 0.9rem "Inter", sans-serif';
            ctx.fillText('Mbps', centerX, centerY + 105);
            
            // Mode Indicator (Minimized & Moved Top to prevent overlap)
            ctx.fillStyle = glowColor;
            ctx.font = '800 1.1rem Rajdhani, sans-serif';
            ctx.letterSpacing = '3px';
            ctx.textTransform = 'uppercase';
            ctx.fillText(label, centerX, centerY - 30);
        };

        const animationId = requestAnimationFrame(drawGauge);
        return () => cancelAnimationFrame(animationId);
    }, [value, color, label]);

    return (
        <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            style={{ 
                width: '100%', 
                maxWidth: '400px', 
                height: 'auto',
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))'
            }}
        />
    );
};

export default SpeedGauge;
