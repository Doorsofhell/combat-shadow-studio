import { useSettings } from '../../store/settings';
import { Segmented } from './Chips';

/**
 * The look of the coaches, the same choice everywhere (settings, fighter studio, training options),
 * saved on the device. Both looks use the same model, skeleton, clothes and animations: only the
 * materials change, the technique shown never does.
 */
export function CoachLookPicker({ testId = 'coach-look' }: { testId?: string }) {
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const premium = settings.coachRender === 'premium';
  // the older "Manga" choice is drawn as Encre by the premium render (the saved value is kept for the fallback)
  const value = premium && settings.coachStyle === 'manga' ? 'encre' : settings.coachStyle;
  const options = premium
    ? [
        { id: 'realiste' as const, label: 'Ultra-réaliste' },
        { id: 'encre' as const, label: 'Encre' },
      ]
    : [
        { id: 'encre' as const, label: 'Encre' },
        { id: 'manga' as const, label: 'Manga' },
        { id: 'realiste' as const, label: 'Réaliste' },
      ];
  return (
    <div data-testid={testId}>
      <Segmented label="Rendu des combattants" value={value} onChange={(v) => set({ coachStyle: v })} options={options} />
    </div>
  );
}
