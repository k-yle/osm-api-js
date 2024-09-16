# Using the Development Server

For experimenting with the API, use the development server documented [here](https://osm.wiki/API_v0.6#URL_+_authentication).
It uses a separate database with less data, allowing you to test without affecting the real database.

1. Create an account and application key on the [development server](https://master.apis.dev.openstreetmap.org/oauth2/applications).

2. Configure the library to use the development server:

```ts
OSM.configure({ apiUrl: "https://master.apis.dev.openstreetmap.org" });
```

Now you're ready to start making requests to the development server!
