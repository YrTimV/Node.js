# A simple translate server application.

Usage:
```
node index.js --serverPort [NUMBER] --logRequests [BOOL]
```

Options:
```
-p, --serverPort [NUMBER]  Bind a custom port for requests (*1024-65535*).  (Default is *3000*)
-l, --logRequests [BOOL]   Log requests in the server console.  (Default is *false*)
```

This server listens for HTTP requests (*GET* method) and use third-party **Yandex Translator API service** for translating text from RU into EN and vice versa.
A user can specify custom port and enable requests console logging with command line options.
