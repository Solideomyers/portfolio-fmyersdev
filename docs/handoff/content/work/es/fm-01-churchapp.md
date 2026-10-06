---
id: FM-01
slug: churchapp
lang: es
title: ChurchApp
summary: Sistema de membresía para una iglesia local, desde la solicitud hasta el voto de la asamblea. Público en 10 días.
client: Gracia Eterna · iglesia local
sector: [Fe, Sin fines de lucro]
modules: [Solicitudes, Cohortes, Asistencia, Entrevistas, Padrón de miembros, Actas, Publicaciones dominicales]
stack: [Next.js, TypeScript, Supabase, Postgres, Vercel]
status: live
version: v1.2.0
role: Diseño, fullstack y despliegue
timeline: Primera versión pública en 10 días, en curso
year: 2026
cover: { src: /work/fm-01/churchapp.png, alt: Página pública de solicitud de membresía de ChurchApp }
shots:
  - { src: /work/fm-01/churchapp.png, alt: Página pública de solicitud de membresía de ChurchApp, caption: Página pública — solicitud y consulta de folio }
  - { src: /work/fm-01/churchapp-panel.jpg, alt: Vista general del panel administrativo de ChurchApp, caption: Panel del equipo — vista de la cohorte }
metrics:
  - { label: Primera versión pública, value: 10 días, date: 2026-09 }
  - { label: Candidatos en la cohorte 3, value: "11", date: 2026-09 }
  - { label: Asistencia promedio, fase 1, value: 100%, date: 2026-09 }
featured: true
order: 1
draft: false
---

## Contexto
Gracia Eterna es una iglesia bautista reformada. Hacerse miembro tiene cuatro fases: una solicitud formal, cinco módulos de instrucción doctrinal cursados en cohorte, una entrevista de confirmación con los pastores y el voto de la asamblea congregacional.

## Problema
La iglesia necesitaba un solo lugar para llevar todo ese proceso: recibir solicitudes, registrar la asistencia clase por clase, aprobar módulos, agendar entrevistas y mantener el padrón de miembros. También hacía falta que cada solicitante pudiera ver en qué punto estaba su expediente sin preguntar a la oficina.

## Restricciones
- El equipo pastoral trabaja desde el teléfono, y el padrón y los boletines se fotocopian en blanco y negro. Los estados se muestran con códigos de letra y bordes, nunca solo con color de fondo.
- Producción guarda datos personales reales. El desarrollo usa una base de datos aparte, y solo una versión publicada toca producción.
- El acceso del equipo es solo por invitación. No hay registro público.

## Solución
- **Página pública:** explica la membresía y sus cuatro fases y recibe la solicitud con el testimonio del solicitante. Este recibe un número de folio por correo y puede consultar su avance con folio y cédula cuando quiera, sin contraseña.
- **Panel del equipo:** candidatos, cohortes, asistencia por clase tomada desde el teléfono, aprobación de módulos uno a uno (reversible), entrevistas de confirmación, padrón de miembros, traslados, actas de asamblea e himnario.
- **Publicaciones dominicales:** boletín, boletín móvil, liturgia y culto de oración, con un orden de culto que la oficina configura sin tocar código.
- **Roles:** Pastor, Secretaría, Maestro, Tesorería, Audiovisual y Administrador. El inicio de sesión con Google solo funciona para cuentas invitadas previamente.
- **Decisión clave:** sin servidor propio. El cliente habla directamente con Supabase, la seguridad a nivel de fila protege cada tabla y la lógica sensible vive en funciones de base de datos y Edge Functions.

## Resultado
- La v1.0.0 pública salió 10 días después del primer commit (25 ago → 4 sep 2026). Siguieron la v1.1.0 el 9 de septiembre y la v1.2.0 el 24.
- La tercera cohorte funciona en el panel: 11 candidatos en la fase 1 con 100% de asistencia promedio (sep 2026).
