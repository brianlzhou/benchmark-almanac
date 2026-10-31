// Lab colours. Eight labs take the eight hues of the validated categorical palette, in its tested order
// (blue, orange, aqua, yellow, magenta, green, violet, red), so the adjacent-pair colour-blind checks
// hold. xAI takes the ink colour, after its black mark. Every other lab is grey. Charts always pair a
// colour with a lab mark or a name, so colour is never the only way to tell labs apart.
// The hex values live in src/styles/global.css as --lab-* tokens, with light and dark steps.

export const LAB_SLOTS = ['openai', 'anthropic', 'google', 'moonshot', 'meta', 'deepseek', 'qwen', 'zai'] as const;

export function labColor(lab: string | undefined): string {
  if (lab === 'xai') return 'var(--lab-xai)';
  const i = LAB_SLOTS.indexOf(lab as (typeof LAB_SLOTS)[number]);
  return i >= 0 ? `var(--lab-${LAB_SLOTS[i]})` : 'var(--lab-other)';
}

export const COLORED_LABS = [...LAB_SLOTS, 'xai'];
