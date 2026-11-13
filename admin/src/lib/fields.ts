import { z } from 'zod';

export type Field =
  | { key: string; type: 'text' | 'number' | 'boolean' | 'list' | 'unsupported' }
  | { key: string; type: 'select'; options: string[] }
  | { key: string; type: 'group'; fields: Field[] }
  // a list of objects (shots, metrics): `fields` describe one item
  | { key: string; type: 'items'; fields: Field[] };

type JsonSchema = {
  type?: string;
  enum?: string[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
};

// Omit over a union has to be distributive, or the variants' own properties are lost.
type WithoutKey<T> = T extends unknown ? Omit<T, 'key'> : never;

const kind = (p: JsonSchema): WithoutKey<Field> =>
  p.enum
    ? { type: 'select', options: p.enum }
    : p.type === 'string'
      ? // text vs textarea is the renderer's call: it depends on the value, not on the schema
        { type: 'text' }
      : p.type === 'number' || p.type === 'integer'
        ? { type: 'number' }
        : p.type === 'boolean'
          ? { type: 'boolean' }
          : p.type === 'array' && p.items?.type === 'string'
            ? { type: 'list' } // one item per line
            : p.type === 'array' && p.items?.type === 'object'
              ? { type: 'items', fields: walk(p.items) }
              : p.type === 'object'
                ? { type: 'group', fields: walk(p) }
                : { type: 'unsupported' };

const walk = (s: JsonSchema): Field[] =>
  Object.entries(s.properties ?? {}).map(([key, p]) => ({ key, ...kind(p) }) as Field);

/** An empty item for a list of objects: '' for texts, 0, false, [] and nested objects likewise. */
export const blankItem = (fields: Field[]): Record<string, unknown> =>
  Object.fromEntries(
    fields
      .filter((f) => f.type !== 'unsupported')
      .map((f) => [
        f.key,
        f.type === 'number'
          ? 0
          : f.type === 'boolean'
            ? false
            : f.type === 'list' || f.type === 'items'
              ? []
              : f.type === 'select'
                ? f.options[0]
                : f.type === 'group'
                  ? blankItem(f.fields)
                  : '',
      ]),
  );

/** The form for a content schema, in the schema's key order. */
export const formFields = (schema: z.ZodType): Field[] =>
  walk(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as JsonSchema);

/** Spanish names for enum values shown as chips. */
export const OPTION_LABELS: Record<string, string> = {
  project: 'Por proyecto',
  month: 'Al mes',
  pricing: 'Precios',
  services: 'Servicios',
  both: 'Ambas',
  live: 'En vivo',
  'in-use': 'En uso',
  wip: 'En desarrollo',
};

/** Spanish labels for the keys the panel shows; an unknown key falls back to its own name. */
export const LABELS: Record<string, string> = {
  name: 'Nombre',
  for: 'Para quién',
  from: 'Precio · USD',
  billing: 'Tipo de cobro',
  includes: 'Incluye',
  timeline: 'Plazo',
  featured: 'Destacado',
  teaser: 'Resumen',
  service: 'Servicio',
  scope: 'Alcance',
  deliver: 'Entrega',
  stack: 'Tecnologías',
  proof: 'Prueba',
  compare: 'Comparación',
  spec: 'Especificación',
  weeklyBuilds: 'Entregas semanales',
  ownership: 'Propiedad',
  fixes: 'Correcciones',
  maintenance: 'Mantenimiento',
  payment: 'Pago',
  page: 'Página donde aparece',
  order: 'Orden',
  q: 'Pregunta',
  a: 'Respuesta',
  rev: 'Revisión del sitio',
  availableFrom: 'Disponible desde',
  email: 'Correo de contacto',
  whatsapp: 'WhatsApp',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  title: 'Nombre',
  slug: 'Slug (URL)',
  summary: 'Resumen',
  client: 'Cliente',
  sector: 'Sector',
  modules: 'Módulos',
  status: 'Estado',
  version: 'Versión',
  role: 'Rol',
  year: 'Año',
  cover: 'Portada',
  src: 'Ruta de la imagen',
  alt: 'Texto alternativo',
  shots: 'Capturas',
  caption: 'Pie de foto',
  metrics: 'Métricas',
  label: 'Etiqueta',
  value: 'Valor',
  date: 'Fecha (AAAA-MM)',
  draft: 'Borrador (oculto en el sitio)',
  repo: 'Repositorio',
  en: 'Descripción EN',
  es: 'Descripción ES',
};
