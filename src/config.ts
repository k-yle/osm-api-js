type Config = {
  /** the base URL for the OSM API. Defaults to `https://api.openstreetmap.org` */
  apiUrl: string;
  /** the HTTP User-Agent sent with every API request */
  userAgent: string;

  /** If you use another library for authentication, you can pass in a custom value for the `Authorization` HTTP header */
  authHeader?: string;
  /** Credentials if you want to login with basic auth (**strongly discouraged**) */
  basicAuth?: { username: string; password: string };
};

const config: Config = {
  apiUrl: "https://api.openstreetmap.org",
  userAgent: "https://github.com/k-yle/osm-api-js",
};

export const getConfig = (): Config => config;

export function configure(updatedConfig: Partial<Config>): void {
  Object.assign(config, updatedConfig);
}
