/**
 * Dynamically loads an external script and resolves true/false based on success.
 * Re-uses the script tag if it was already appended to the document.
 *
 * @param {string} src - The script URL to load
 * @returns {Promise<boolean>}
 */
export const loadScript = (src) => {
  return new Promise((resolve) => {
    // If already loaded, resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
