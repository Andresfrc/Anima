/**
 * silenceLogs.ts — Silencia logs ruidosos en builds de producción.
 *
 * En producción (`__DEV__ === false`) anulamos console.log/info/debug para no
 * filtrar información interna en los logs del dispositivo ni gastar ciclos del
 * hilo JS. Conservamos console.warn y console.error para diagnóstico y reportes
 * de error (ej. Sentry/ErrorBoundary).
 *
 * Se importa como primer efecto en el layout raíz, antes que el resto de la app.
 */
if (!__DEV__) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}

export {};
