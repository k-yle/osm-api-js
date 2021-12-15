/**
 * resolves once the login flow in the popup is sucessful.
 * rejects if the popup is closed by the user or if there's an error.
 * @internal
 */
export function createPopup(loginUrl: string): Promise<string> {
  let resolved = false;
  return new Promise((resolve, reject) => {
    const [width, height] = [600, 550];
    const settings = Object.entries({
      width,
      height,
      left: window.screen.width / 2 - width / 2,
      top: window.screen.height / 2 - height / 2,
    })
      .map(([k, v]) => `${k}=${v}`)
      .join(",");

    const popup = window.open("about:blank", "oauth_window", settings);
    if (!popup) throw new Error("Popup was blocked");
    popup.location = loginUrl;

    window.authComplete = (fullUrl: string) => {
      resolve(fullUrl);
      resolved = true;
    };

    // check every 0.5seconds if the popup has been closed by the user.
    const intervalId: NodeJS.Timer = setInterval(() => {
      if (popup.closed) {
        if (!resolved) reject(new Error("Cancelled"));
        clearInterval(intervalId);
      }
    }, 500);
  });
}
