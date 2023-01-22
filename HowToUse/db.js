const db = await client.createDatabase()

db.create("abooby", "dumb")//creates a key with the value in the database
db.save("flurri", "smart")//saves value into the key in the database
await db.get("flurri")//will return the value, right now itll return "smart"
