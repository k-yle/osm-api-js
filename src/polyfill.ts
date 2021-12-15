if (typeof fetch === "undefined") {
  try {
    // eslint-disable-next-line global-require
    require("isomorphic-fetch");
  } catch {
    console.error(
      [
        "\n==========\n",
        "(!) The `fetch` API is not available, and the polyfill (`isomorphic-fetch`) is also not available.",
        "Run `npm install isomorphic-fetch`, or make sure that the global variable `fetch` exists",
        "\n==========\n",
      ].join("\n")
    );
  }
}
