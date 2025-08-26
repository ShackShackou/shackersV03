import React from 'react';
import { Stage, Graphics } from '@pixi/react';
import { Part, useCharacter } from '../hooks/useCharacter';

// Example parts with color placeholders
const PARTS: Part[] = [
  { name: 'head', textures: ['#ff0000', '#00ff00', '#0000ff'] },
  { name: 'body', textures: ['#ffff00', '#00ffff', '#ff00ff'] },
  { name: 'legs', textures: ['#ffffff', '#999999', '#000000'] },
];

// Helper to draw a colored square for a part
const drawSquare = (g: PIXI.Graphics, color: string, x: number) => {
  g.clear();
  g.beginFill(parseInt(color.replace('#', ''), 16));
  g.drawRect(x, 0, 100, 100);
  g.endFill();
};

const CreatorView = () => {
  const { selection, select, randomize } = useCharacter(PARTS);

  return (
    <div>
      <button onClick={randomize}>Randomize</button>
      <Stage width={PARTS.length * 120} height={120} options={{ backgroundAlpha: 0 }}>
        {PARTS.map((part, i) => (
          <Graphics
            key={part.name}
            draw={(g) => drawSquare(g, part.textures[selection[part.name]], i * 120)}
            eventMode="static"
            pointerdown={() => select(part.name, (selection[part.name] + 1) % part.textures.length)}
          />
        ))}
      </Stage>
    </div>
  );
};

export default CreatorView;
