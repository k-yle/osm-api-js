# Using the Development Server

For experimenting with the API, use the development server documented [here](https://wiki.openstreetmap.org/wiki/API_v0.6). It uses a separate database with less data, allowing you to test freely without concerns.

1. Create an account and application key on the [development server](https://master.apis.dev.openstreetmap.org/oauth2/applications).

2. Configure the library to use the development server:

``` ts
OSM.configure({ apiUrl: "https://master.apis.dev.openstreetmap.org" })
```

With configure you can also change the user agent and other options as seen in [config.ts](../src/config.ts).

Now you're ready to start making requests to the development server!
