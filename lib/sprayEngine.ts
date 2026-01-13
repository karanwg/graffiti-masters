import { CanType, WallType, GRID_RESOLUTION } from './types';
import { getSchoolMortarLines } from './wallGenerator';

// Juicy Spray Engine with Splat, Grain, and Drip effects

interface Drip {
  x: number;
  y: number;
  speed: number;
  color: string;
  width: number;
  followingMortar: boolean;
  mortarEndX: number;
}

interface SprayEngineState {
  drips: Drip[];
  mortarLines: number[];
  lastSprayTime: number;
  lastSprayX: number;
  lastSprayY: number;
  stillTime: number;
}

const state: SprayEngineState = {
  drips: [],
  mortarLines: [],
  lastSprayTime: 0,
  lastSprayX: 0,
  lastSprayY: 0,
  stillTime: 0,
};

export function initSprayEngine(wallType: WallType, canvasHeight: number) {
  state.drips = [];
  state.mortarLines = wallType === 'school' ? getSchoolMortarLines(canvasHeight) : [];
  state.stillTime = 0;
}

// Generate a jagged, organic polygon for the SPLAT effect
function drawSplat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  const points = 12 + Math.floor(Math.random() * 8);
  const angleStep = (Math.PI * 2) / points;
  
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep + (Math.random() - 0.5) * 0.3;
    const r = radius * (0.6 + Math.random() * 0.6);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
}

// Draw splat-splash liquid spray effect
function drawGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  // Parse color to get RGB
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, 1, 1);
  const colorData = tempCtx.getImageData(0, 0, 1, 1).data;
  const r = colorData[0];
  const g = colorData[1];
  const b = colorData[2];
  
  // Draw main irregular splat shape (not a perfect circle)
  ctx.beginPath();
  const points = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = radius * (0.5 + Math.random() * 0.5);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      // Use quadratic curves for organic blob shape
      const cpAngle = angle - (Math.PI / points);
      const cpDist = radius * (0.6 + Math.random() * 0.4);
      const cpx = x + Math.cos(cpAngle) * cpDist;
      const cpy = y + Math.sin(cpAngle) * cpDist;
      ctx.quadraticCurveTo(cpx, cpy, px, py);
    }
  }
  ctx.closePath();
  
  // Fill with gradient for depth
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
  gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.7)`);
  gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.4)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add scattered splatter droplets
  const dropletCount = Math.floor(radius * 1.5);
  for (let i = 0; i < dropletCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Droplets spread further out with some clustering
    const dist = radius * (0.3 + Math.pow(Math.random(), 0.7) * 1.5);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    
    // Varied droplet sizes - some tiny, some bigger splats
    const size = Math.random() < 0.8 
      ? 1 + Math.random() * 2  // Small dots
      : 3 + Math.random() * 4; // Bigger splats
    
    const alpha = 0.3 + Math.random() * 0.5;
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add a few larger "splash" blobs around the edges
  const splashCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < splashCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.7 + Math.random() * 0.8);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const splashRadius = 3 + Math.random() * 5;
    
    // Mini blob shape for splash
    ctx.beginPath();
    const splashPoints = 5 + Math.floor(Math.random() * 3);
    for (let j = 0; j < splashPoints; j++) {
      const sAngle = (j / splashPoints) * Math.PI * 2;
      const sDist = splashRadius * (0.6 + Math.random() * 0.4);
      const spx = px + Math.cos(sAngle) * sDist;
      const spy = py + Math.sin(sAngle) * sDist;
      if (j === 0) ctx.moveTo(spx, spy);
      else ctx.lineTo(spx, spy);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + Math.random() * 0.4})`;
    ctx.fill();
  }
}

// Create a drip that falls down
function createDrip(x: number, y: number, color: string, wallType: WallType) {
  const drip: Drip = {
    x,
    y,
    speed: 0.5 + Math.random() * 1,
    color,
    width: 2 + Math.random() * 3,
    followingMortar: false,
    mortarEndX: x + (Math.random() > 0.5 ? 5 : -5),
  };
  
  state.drips.push(drip);
}

// Update and draw all drips
export function updateDrips(
  ctx: CanvasRenderingContext2D,
  deltaTime: number,
  wallType: WallType
) {
  const mortarLines = state.mortarLines;
  
  for (let i = state.drips.length - 1; i >= 0; i--) {
    const drip = state.drips[i];
    
    // Check if drip hits a mortar line (school wall only)
    if (wallType === 'school' && !drip.followingMortar) {
      for (const mortarY of mortarLines) {
        if (drip.y < mortarY && drip.y + drip.speed * deltaTime * 60 >= mortarY) {
          drip.followingMortar = true;
          drip.y = mortarY;
          break;
        }
      }
    }
    
    // Move drip
    if (drip.followingMortar) {
      // Follow mortar line horizontally for 5px
      const dir = drip.mortarEndX > drip.x ? 1 : -1;
      drip.x += dir * 0.5 * deltaTime * 60;
      
      if (Math.abs(drip.x - drip.mortarEndX) < 1) {
        drip.followingMortar = false;
      }
    } else {
      drip.y += drip.speed * deltaTime * 60;
    }
    
    // Draw drip
    ctx.fillStyle = drip.color;
    ctx.beginPath();
    ctx.ellipse(drip.x, drip.y, drip.width / 2, drip.width, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw drip trail
    ctx.strokeStyle = drip.color;
    ctx.lineWidth = drip.width * 0.6;
    ctx.beginPath();
    ctx.moveTo(drip.x, drip.y - 10);
    ctx.lineTo(drip.x, drip.y);
    ctx.stroke();
    
    // Remove drips that go off screen
    if (drip.y > ctx.canvas.height + 10) {
      state.drips.splice(i, 1);
    }
  }
}

// Main spray function
export function spray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  canType: CanType,
  teamColor: string,
  wallType: WallType,
  isMouseDown: boolean,
  deltaTime: number
): { gridUpdates: { gx: number; gy: number }[] } {
  const baseRadius = 7;
  const radius = canType === 'fat' ? baseRadius * 2 : baseRadius * 0.5;
  const gridUpdates: { gx: number; gy: number }[] = [];
  
  // Calculate grid positions to mark
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const cellWidth = canvasWidth / GRID_RESOLUTION;
  const cellHeight = canvasHeight / GRID_RESOLUTION;
  
  // Mark cells within spray radius
  const gridRadius = Math.ceil(radius / Math.min(cellWidth, cellHeight));
  const centerGX = Math.floor(x / cellWidth);
  const centerGY = Math.floor(y / cellHeight);
  
  for (let gx = centerGX - gridRadius; gx <= centerGX + gridRadius; gx++) {
    for (let gy = centerGY - gridRadius; gy <= centerGY + gridRadius; gy++) {
      if (gx >= 0 && gx < GRID_RESOLUTION && gy >= 0 && gy < GRID_RESOLUTION) {
        const px = gx * cellWidth + cellWidth / 2;
        const py = gy * cellHeight + cellHeight / 2;
        const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        
        if (dist < radius * 0.8) {
          gridUpdates.push({ gx, gy });
        }
      }
    }
  }
  
  // Draw the spray
  drawGrain(ctx, x, y, radius, teamColor);
  
  // Track stillness for drips
  const now = Date.now();
  const distance = Math.sqrt((x - state.lastSprayX) ** 2 + (y - state.lastSprayY) ** 2);
  
  if (distance < 5) {
    state.stillTime += deltaTime;
  } else {
    state.stillTime = 0;
  }
  
  // Create drips if cursor stays still
  if (state.stillTime > 0.3 && Math.random() > 0.7) {
    createDrip(
      x + (Math.random() - 0.5) * radius,
      y + radius * 0.5,
      teamColor,
      wallType
    );
    state.stillTime = 0.15; // Reset partially to control drip rate
  }
  
  state.lastSprayX = x;
  state.lastSprayY = y;
  state.lastSprayTime = now;
  
  return { gridUpdates };
}

// Draw initial splat on mousedown
export function drawInitialSplat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  canType: CanType,
  teamColor: string
) {
  const baseRadius = 20;
  const radius = canType === 'fat' ? baseRadius * 2.5 : baseRadius;
  drawSplat(ctx, x, y, radius, teamColor);
}

// Screen shake effect
export function triggerScreenShake(element: HTMLElement, intensity: number = 5) {
  const originalTransform = element.style.transform;
  let shakeCount = 0;
  const maxShakes = 10;
  
  const shake = () => {
    if (shakeCount >= maxShakes) {
      element.style.transform = originalTransform;
      return;
    }
    
    const x = (Math.random() - 0.5) * intensity * 2;
    const y = (Math.random() - 0.5) * intensity * 2;
    element.style.transform = `translate(${x}px, ${y}px)`;
    
    shakeCount++;
    requestAnimationFrame(shake);
  };
  
  shake();
}

// Clear all drips (for game reset)
export function clearDrips() {
  state.drips = [];
}
