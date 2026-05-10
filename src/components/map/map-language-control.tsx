function getMapLanguageKey(directionsLanguage: string): string | null {
  const base = directionsLanguage.split('-')[0];
  if (base === 'en' || base === 'de') {
    return base;
  }
  return null;
}

export function updateMapLabels(
  map: maplibregl.Map | undefined,
  directionsLanguage: string
) {
  if (!map) return;

  const style = map.getStyle();
  if (!style?.layers) return;

  const langKey = getMapLanguageKey(directionsLanguage);

  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;

    const textField = (layer.layout as Record<string, unknown>)?.['text-field'];

    // Shortbread: simple string like "{name}", "{name_en}", "{name_de}"
    if (typeof textField === 'string') {
      if (!textField.match(/\{name(_[a-z]{2})?\}/)) continue;

      const newTextField = langKey ? `{name_${langKey}}` : '{name}';
      map.setLayoutProperty(layer.id, 'text-field', newTextField);
      continue;
    }

    // Alidade Smooth: expression-based, e.g. ["get", "name:latin"]
    // or ["coalesce", ["get", "name:en"], ["get", "name:latin"]]
    if (Array.isArray(textField)) {
      const json = JSON.stringify(textField);
      if (!json.includes('"name:') && !json.includes('"name"')) continue;

      if (langKey) {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', `name:${langKey}`],
          ['get', 'name:latin'],
          ['get', 'name'],
        ]);
      } else {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', 'name:latin'],
          ['get', 'name'],
        ]);
      }
    }
  }
}
