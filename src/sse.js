/**
 * Livereload script
 *
 * See details in `npm run watch` script.
 * This will not injected to production builds.
 */
const sse = new EventSource('http://localhost:8012');

sse.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    if (data.reload) {
        // window.location.reload();
        mdv.reload();
    }
});
window.addEventListener('unload', () => sse.close());
