import { WallType } from './types';

// Procedural Wall Texture Generator
// Draws textures to an off-screen canvas for each wall type

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function addNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  random: () => number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (random() - 0.5) * intensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

function generateSchoolWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const random = seededRandom(42);
  
  // Light gray mortar background
  ctx.fillStyle = '#a8a8a8';
  ctx.fillRect(0, 0, width, height);
  
  // Brick dimensions
  const brickWidth = 60;
  const brickHeight = 25;
  const mortarSize = 4;
  
  // Draw staggered bricks
  for (let row = 0; row < Math.ceil(height / (brickHeight + mortarSize)); row++) {
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    
    for (let col = -1; col < Math.ceil(width / (brickWidth + mortarSize)) + 1; col++) {
      const x = col * (brickWidth + mortarSize) + offset;
      const y = row * (brickHeight + mortarSize);
      
      // ±10% color variance for red bricks
      const variance = 0.9 + random() * 0.2;
      const baseRed = Math.floor(180 * variance);
      const baseGreen = Math.floor(60 * variance);
      const baseBlue = Math.floor(50 * variance);
      
      ctx.fillStyle = `rgb(${baseRed}, ${baseGreen}, ${baseBlue})`;
      ctx.fillRect(x, y, brickWidth, brickHeight);
      
      // Subtle inner shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(x, y + brickHeight - 3, brickWidth, 3);
      ctx.fillRect(x + brickWidth - 3, y, 3, brickHeight);
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y, brickWidth, 2);
      ctx.fillRect(x, y, 2, brickHeight);
    }
  }
  
  // Add subtle noise speckles
  addNoise(ctx, width, height, 15, random);
}

function generateSubwayWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const random = seededRandom(123);
  
  // Dark grout background
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, width, height);
  
  // Tile dimensions
  const tileWidth = 50;
  const tileHeight = 50;
  const groutSize = 3;
  
  for (let row = 0; row < Math.ceil(height / (tileHeight + groutSize)); row++) {
    for (let col = 0; col < Math.ceil(width / (tileWidth + groutSize)); col++) {
      const x = col * (tileWidth + groutSize);
      const y = row * (tileHeight + groutSize);
      
      // White glossy tiles with slight variation
      const brightness = 230 + Math.floor(random() * 25);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, tileWidth, tileHeight);
      
      // Inner shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(x, y + tileHeight - 4, tileWidth, 4);
      ctx.fillRect(x + tileWidth - 4, y, 4, tileHeight);
      
      // Glossy highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 2, y + 2, tileWidth - 10, 3);
      
      // Metallic accent on some tiles
      if (random() > 0.92) {
        ctx.fillStyle = 'rgba(192, 192, 192, 0.5)';
        ctx.fillRect(x + 5, y + 5, tileWidth - 10, tileHeight - 10);
      }
    }
  }
}

function generatePoliceWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const random = seededRandom(789);
  
  // Dark charcoal concrete base
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, width, height);
  
  // Add "pitting" - thousands of tiny dots
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    if (random() > 0.7) {
      const pit = random() > 0.5 ? -20 : 10;
      data[i] = Math.max(0, Math.min(255, data[i] + pit));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + pit));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + pit));
    }
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Add procedural cracks
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  
  for (let crack = 0; crack < 2; crack++) {
    ctx.beginPath();
    let x = random() * width;
    let y = random() * height * 0.3;
    ctx.moveTo(x, y);
    
    const segments = 5 + Math.floor(random() * 5);
    for (let i = 0; i < segments; i++) {
      x += (random() - 0.5) * 80;
      y += 20 + random() * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  // Heavy grain
  addNoise(ctx, width, height, 25, random);
}

function generateParkingWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const random = seededRandom(456);
  
  // Asphalt charcoal base
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
  
  // Heavy grain texture
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const grain = (random() - 0.5) * 40;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Distressed yellow parking line at 45 degrees
  ctx.save();
  ctx.translate(width * 0.7, height * 0.2);
  ctx.rotate(Math.PI / 4);
  
  // Main yellow line
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(-15, 0, 30, height * 1.5);
  
  // Add distressing to the line
  ctx.fillStyle = 'rgba(26, 26, 26, 0.6)';
  for (let i = 0; i < 20; i++) {
    const dx = random() * 30 - 15;
    const dy = random() * height * 1.5;
    const dw = 5 + random() * 15;
    const dh = 2 + random() * 8;
    ctx.fillRect(dx, dy, dw, dh);
  }
  
  ctx.restore();
  
  // Add more heavy grain
  addNoise(ctx, width, height, 20, random);
}

export function generateWall(
  type: WallType,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  switch (type) {
    case 'school':
      generateSchoolWall(ctx, width, height);
      break;
    case 'subway':
      generateSubwayWall(ctx, width, height);
      break;
    case 'police':
      generatePoliceWall(ctx, width, height);
      break;
    case 'parking':
      generateParkingWall(ctx, width, height);
      break;
  }
  
  return canvas;
}

// Get the mortar line Y positions for the school wall (for drip physics)
export function getSchoolMortarLines(height: number): number[] {
  const brickHeight = 25;
  const mortarSize = 4;
  const lines: number[] = [];
  
  for (let row = 1; row < Math.ceil(height / (brickHeight + mortarSize)); row++) {
    lines.push(row * (brickHeight + mortarSize) - mortarSize / 2);
  }
  
  return lines;
}
