# Node-login
### A login system based in Node.js
#### Configuration/Installation Instructions
1. Install MongoDB
2. Run ```npm install```
3. Create a data folder
4. Modify nodemailer setup variables in auth.json (By default, there is a package for mailgun)
5. Start up the MongoDB server with ```mongod --dbpath 'path to data folder'```
6. Change the database in app.js on line 72 (optional)
7. Start node ``` node app.js ```
8. Go to <http://localhost:1337/register>
9. Register the first user to create the database
  * <b>Extra</b>: Go to: <http://localhost:1337/userlist> to see the user
