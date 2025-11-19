export const TAG_COLORS = {
  'Cafetería': '#d6a279',
  'Peluquería': '#7db5ea',
  'Panadería': '#ebd8b0',
  'Pastelería': '#f4a7b9',
  'Farmacia': '#86dfa3',
  'Veterinaria': '#5cbf8c',
  'Ferretería': '#f6d37a',
  'Otra': '#c6a0f6',
};
export const colorFor = (tag) => TAG_COLORS[tag] || TAG_COLORS['Otra'];
export const principalFrom = (pyme) => {
  const et = Array.isArray(pyme?.etiquetas) ? pyme.etiquetas : [];
  if (et.length) return et[0];
  const ts = Array.isArray(pyme?.tipo_servicio) ? pyme.tipo_servicio : [pyme?.tipo_servicio].filter(Boolean);
  return ts[0] || 'Otra';
};
export default { TAG_COLORS, colorFor, principalFrom };