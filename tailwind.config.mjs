/**
 * Design tokens uit de Claude Design-export (Repair Cafe Haarlem UI-ontwerp v1).
 * Dit is de enige plek met kleurwaarden; componenten gebruiken alleen deze namen.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  theme: {
    extend: {
      colors: {
        paper: '#F6F1E7', // achtergrond publiek
        surface: '#FFFDF9', // kaarten, velden, crew
        ink: {
          DEFAULT: '#231F1A', // tekst, crew-knoppen
          muted: '#5F5549', // hulptekst (6,4:1 op paper)
          line: '#4A423A', // scheidingslijn op donker (menu)
        },
        line: {
          DEFAULT: '#D8CCB8', // scheiding
          strong: '#8C7F6E', // veldrand (3,9:1)
        },
        sand: {
          DEFAULT: '#EFE7DA', // neutrale badge, info-melding
          light: '#EFE9DE', // uitgeschakelde sessiekaart
        },
        off: '#E4DBCC', // uitgeschakelde knop
        rust: {
          DEFAULT: '#B4441A', // primaire actie (5,5:1 met wit)
          300: '#E08A5F', // actieve onderstreping op donker
          700: '#8F3413', // links, schaduw, bezig-knop
          50: '#F7E3D6', // gekozen sessie, open rij
        },
        ok: { DEFAULT: '#2E6B4F', 50: '#E2EEE6' },
        warn: { DEFAULT: '#7A4E00', 50: '#FCF0D6' },
        error: { DEFAULT: '#A3261B', 50: '#FBEAE5' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        tiny: ['11px', '1.4'], // crew-badge
        meta: ['13px', '1.4'], // crew-labels, mono-kopjes
        small: ['15px', '1.5'], // tussenmaat publiek
        lead: ['17px', '1.5'], // grote knoppen, intro mobiel
      },
      borderRadius: {
        lg: '8px', // knop, veld
        tag: '10px', // referentielabel
        xl: '12px', // kaart
      },
      borderWidth: {
        thin: '1.5px',
      },
      minHeight: {
        touch: '44px', // minimum doelgrootte, crew-knoppen
        btn: '48px', // publieke velden en knoppen
        'btn-lg': '52px', // primaire publieke knop
        row: '56px', // menu-items, crew-balk
        card: '60px', // sessiekaart
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        btn: '0 2px 0 #8F3413',
        card: '4px 4px 0 #D8CCB8',
        tag: '3px 4px 0 #D8CCB8',
      },
      backgroundImage: {
        stripes: 'repeating-linear-gradient(135deg, #E9E0D0 0 8px, #F1EADD 8px 16px)',
        'stripes-sm': 'repeating-linear-gradient(135deg, #EFE9DE 0 6px, #F6F1E7 6px 12px)',
      },
      maxWidth: {
        page: '1080px',
      },
    },
  },
};
