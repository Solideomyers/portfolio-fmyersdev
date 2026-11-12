import { z } from 'zod';

export type Field =
  | { key: string; type: 'text' | 'number' | 'boolean' | 'list' | 'unsupported' }
  | { key: string; type: 'select'; options: string[] }
  | { key: string; type: 'group'; fields: Field[] };

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
            : p.type === 'object'
              ? { type: 'group', fields: walk(p) }
              : { type: 'unsupported' }; // e.g. arrays of objects, until the project editor

const walk = (s: JsonSchema): Field[] =>
  Object.entries(s.properties ?? {}).map(([key, p]) => ({ key, ...kind(p) }) as Field);

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
};
