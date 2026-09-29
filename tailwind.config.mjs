/**
 * Tailwind verwijst alleen naar de design tokens in src/styles/global.css (:root).
 * Waarden wijzigen doe je daar; hier staan alleen de namen. Geen kleurwaarden in componenten.
 *
 * @type {import('tailwindcss').Config}
 */
const v = (naam) => `var(--${naam})`;

export default {
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: v('kleur-papier'), deep: v('kleur-papier-diep') },
        kraft: v('kleur-kraft'),
        surface: v('kleur-vlak'),
        ink: {
          DEFAULT: v('kleur-inkt'),
          muted: v('kleur-inkt-zacht'),
          line: v('kleur-inkt-lijn'),
          licht: v('kleur-inkt-licht'),
        },
        line: { DEFAULT: v('kleur-lijn'), strong: v('kleur-lijn-sterk') },
        sand: { DEFAULT: v('kleur-zand'), light: v('kleur-zand-licht') },
        off: v('kleur-uit'),
        // "rust" = het oranje. DEFAULT is de donkere tint voor knoppen en links (contrast >= 4.5:1),
        // signaal (#E0561F) alleen voor decoratie, grote koppen en de focusring.
        rust: {
          DEFAULT: v('kleur-oranje'),
          700: v('kleur-oranje-diep'),
          300: v('kleur-signaal'),
          50: v('kleur-oranje-zacht'),
        },
        signaal: v('kleur-signaal'),
        ok: { DEFAULT: v('kleur-ok'), 50: v('kleur-ok-zacht') },
        warn: { DEFAULT: v('kleur-let-op'), 50: v('kleur-let-op-zacht') },
        error: { DEFAULT: v('kleur-fout'), 50: v('kleur-fout-zacht') },
      },
      fontFamily: {
        display: [v('font-rc-display')],
        sans: [v('font-rc-tekst')],
        mono: [v('font-rc-mono')],
      },
      fontSize: {
        tiny: [v('tekst-2xs'), '1.4'],
        meta: [v('tekst-xs'), '1.4'],
        small: [v('tekst-sm'), '1.5'],
        lead: [v('tekst-lg'), '1.5'],
        'kop-1': [v('tekst-kop-1'), '0.98'],
        'kop-2': [v('tekst-kop-2'), '1.05'],
        'kop-3': [v('tekst-kop-3'), '1.15'],
      },
      spacing: {
        rand: v('ruimte-rand'),
        sectie: v('ruimte-sectie'),
      },
      borderRadius: {
        lg: v('radius-md'),
        tag: v('radius-label'),
        xl: v('radius-lg'),
      },
      borderWidth: {
        thin: '1.5px',
      },
      minHeight: {
        touch: '44px',
        btn: '48px',
        'btn-lg': '52px',
        row: '56px',
        card: '60px',
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        btn: v('schaduw-knop'),
        card: v('schaduw-kaart'),
        tag: v('schaduw-label'),
      },
      backgroundImage: {
        stripes: v('patroon-strepen'),
        'stripes-sm': v('patroon-strepen-fijn'),
      },
      maxWidth: {
        page: v('breedte-pagina'),
      },
      transitionTimingFunction: {
        uit: v('ease-uit'),
        veer: v('ease-veer'),
      },
      transitionDuration: {
        snel: v('duur-snel'),
        basis: v('duur-basis'),
        traag: v('duur-traag'),
      },
    },
  },
};
