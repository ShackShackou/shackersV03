import { useCallback, useMemo, useState } from 'react';

// Part represents a selectable character part with multiple texture options
export type Part = {
  /** unique name of the part */
  name: string;
  /** available texture options for this part */
  textures: string[];
};

// Generate a random selection for all parts
export const randomize = (parts: Part[]): Record<string, number> => {
  const selection: Record<string, number> = {};
  parts.forEach((p) => {
    selection[p.name] = Math.floor(Math.random() * p.textures.length);
  });
  return selection;
};

// Get a string seed representing current selection
export const getSeed = (selection: Record<string, number>): string => {
  return Object.keys(selection)
    .sort()
    .map((key) => `${key}:${selection[key]}`)
    .join('|');
};

// Hook handling character part selection state
export const useCharacter = (parts: Part[]) => {
  const [selection, setSelection] = useState<Record<string, number>>(() => randomize(parts));

  // Select a specific option for a part
  const select = useCallback((name: string, index: number) => {
    setSelection((s) => ({ ...s, [name]: index }));
  }, []);

  // Randomize all parts
  const randomizeAll = useCallback(() => {
    setSelection(randomize(parts));
  }, [parts]);

  // Compute a seed from the selection
  const seed = useMemo(() => getSeed(selection), [selection]);

  return {
    parts,
    selection,
    select,
    randomize: randomizeAll,
    seed,
  };
};

export default useCharacter;
