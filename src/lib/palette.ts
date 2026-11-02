// Lab colors. Eight labs take the eight hues of the validated categorical palette, in its tested order
// (blue, orange, aqua, yellow, magenta, green, violet, red), so the adjacent-pair color-blind checks
// hold. xAI takes the ink color, after its black mark. Every other lab is gray. Charts always pair a
// color with a lab mark or a name, so color is never the only way to tell labs apart.
// The hex values live in src/styles/global.css as --lab-* tokens, with light and dark steps.

export const LAB_SLOTS = ['openai', 'anthropic', 'google', 'moonshot', 'meta', 'deepseek', 'qwen', 'zai'] as const;

export function labColor(lab: string | undefined): string {
  if (lab === 'xai') return 'var(--lab-xai)';
  const i = LAB_SLOTS.indexOf(lab as (typeof LAB_SLOTS)[number]);
  return i >= 0 ? `var(--lab-${LAB_SLOTS[i]})` : 'var(--lab-other)';
}

/** Text color for a label set inside a lab-colored fill: white or near-black, whichever reads better. */
export function onLabColor(lab: string | undefined): string {
  const id = lab === 'xai' || LAB_SLOTS.includes(lab as (typeof LAB_SLOTS)[number]) ? lab : 'other';
  return `var(--on-lab-${id})`;
}
