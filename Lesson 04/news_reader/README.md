# A simple news reader web service.

Usage:
```
node index.js --serverPort [NUMBER]
```

Options:
```
-p, --serverPort [NUMBER]  Bind a custom port for requests (*1024-65535*).  (Default is *3000*)
```

This server listens for HTTP requests (*GET* method) and use fetches news info (categories, headers, time, text) for different sites (right now only *www.vesti.ru* site is parsed).
A user can specify custom port with command line options.
When the user requests a root page, a news fetch settings form is rendered. With the help of list-boxes the user can choose a number of news, from which site and from which category to fetch.

Optional URL request params:
```
newsCount=[NUMBER]   **10/20/30/0** - selects 10/20/30 or all news to fetch on one page.
newsSite=[STRING]    **vesti** - chooses vesti.ru news portal.
```
