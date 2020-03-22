# Budget Tracker

## Purpose of Application

This is a simple budget tracker application that stores its data in a MongoDB database.  The application uses the Node package Mongoose to query the database in JavaScript.  The budget tracker has additional offline functionality.  The static files are stored in a cache, so they can be accessed when the program is offline.  Additionally, any transactions that are added when the program is offline are stored in an IndexedDB in the browser.  IndexedDB is a JavaScript-based object-oriented transactional database that stores data locally, so there is no need for a network connection to use it.

The program first attempts to use the MongoDB to store data.  If this succeeds, the data is stored and displayed on the page, and nothing else is needed.  If the program fails to reach the MongoDB because the browser is offline, it then stores the transactions temporarily in the IndexedDB until the program comes back online.  When the browser comes back online, it triggers a function that takes all transactions stored in IndexedDB and moves them to the MongoDB, and clears the IndexedDB.  In this way, the program is functional both with and without an internet connection.

## Resources Used

https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API - Documentation on IndexedDB.

## License
[MIT](https://choosealicense.com/licenses/mit/)