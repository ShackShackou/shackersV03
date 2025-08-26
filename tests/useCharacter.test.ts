import { getSeed } from '../src/hooks/useCharacter';

describe('useCharacter.getSeed', () => {
  it('returns parseable JSON', () => {
    const seed = getSeed();
    expect(() => JSON.parse(seed)).not.toThrow();
  });
});
